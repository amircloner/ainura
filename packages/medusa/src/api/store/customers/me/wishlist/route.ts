import { createWishlistItemsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { requireVisibleProduct } from "../../../utils/visible-products"
import { StoreCreateWishlistItemType } from "../../validators"
import { queryWishlist } from "./helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreWishlistItemListResponse>
) => {
  const { data: wishlist_items, metadata } = await queryWishlist(req)

  res.json({
    wishlist_items,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateWishlistItemType>,
  res: MedusaResponse<HttpTypes.StoreWishlistItemResponse>
) => {
  const customerId = req.auth_context.actor_id
  const { product_id, variant_id, metadata } = req.validatedBody
  const product = await requireVisibleProduct(
    req,
    product_id,
    variant_id ? ["id", "variants.id"] : ["id"]
  )
  if (
    variant_id &&
    !product.variants?.some((variant) => variant.id === variant_id)
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Variant does not belong to this product"
    )
  }

  const { data: existing } = await queryWishlist(req, { product_id })

  if (existing.length > 0) {
    res.status(200).json({
      wishlist_item: existing[0],
    })
    return
  }

  const { result } = await createWishlistItemsWorkflow(req.scope).run({
    input: {
      items: [
        {
          customer_id: customerId,
          product_id,
          variant_id: variant_id ?? null,
          metadata: metadata ?? undefined,
        },
      ],
    },
  })

  const { data: created } = await queryWishlist(req, { id: result[0].id })

  res.status(200).json({
    wishlist_item: created[0],
  })
}
