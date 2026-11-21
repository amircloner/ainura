import { deleteWishlistItemsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.StoreWishlistItemDeleteResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const customerId = req.auth_context.actor_id
  const id = req.params.id

  const { data: items } = await query.graph({
    entity: "customer_wishlist_item",
    filters: {
      id,
      customer_id: customerId,
    },
    fields: ["id"],
  })

  if (!items.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Wishlist item with id "${id}" not found`
    )
  }

  await deleteWishlistItemsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "wishlist_item",
    deleted: true,
  })
}
