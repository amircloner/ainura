import type { AuthenticatedMedusaRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listVisibleProducts } from "../../../utils/visible-products"
import {
  storeWishlistProductFields,
  storeWishlistVariantFields,
} from "../../query-config"

export async function queryWishlist(
  req: AuthenticatedMedusaRequest,
  filters: { id?: string; product_id?: string } = {}
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { fields, pagination } = req.queryConfig
  const itemFields = fields.filter(
    (field) => !/^(product|variant)(?:\.|$)/.test(field)
  )
  const relationFields = (relation: string, defaults: string[]) =>
    fields.flatMap((field) => {
      if (field === relation || field === `${relation}.*`) {
        return defaults
      }
      return field.startsWith(`${relation}.`)
        ? [field.slice(relation.length + 1)]
        : []
    })
  const productFields = relationFields("product", storeWishlistProductFields)
  const variantFields = relationFields("variant", storeWishlistVariantFields)
  const expandsCatalog = productFields.length || variantFields.length
  const result = await query.graph({
    entity: "customer_wishlist_item",
    filters: { ...filters, customer_id: req.auth_context.actor_id },
    pagination,
    fields: expandsCatalog
      ? [...new Set([...itemFields, "product_id", "variant_id"])]
      : itemFields,
  })

  // Keep unavailable items on the wishlist, but do not resolve their catalog data.
  if (expandsCatalog && result.data.length) {
    const products = await listVisibleProducts(
      req,
      { id: [...new Set(result.data.map((item) => item.product_id))] },
      [...new Set(["id", ...productFields])]
    )
    const productById = new Map(
      products.map((product) => [product.id, product])
    )
    const eligibleVariantIds = result.data.flatMap((item) =>
      item.variant_id && productById.has(item.product_id)
        ? [item.variant_id]
        : []
    )
    const { data: variants } =
      variantFields.length && eligibleVariantIds.length
        ? await query.graph(
            {
              entity: "product_variant",
              filters: { id: eligibleVariantIds },
              fields: [...new Set(["id", "product_id", ...variantFields])],
            },
            { locale: req.locale }
          )
        : { data: [] }
    const variantById = new Map(
      variants.map((variant) => [variant.id, variant])
    )
    for (const item of result.data) {
      const product = productById.get(item.product_id)
      const variant = variantById.get(item.variant_id)
      if (productFields.length) {
        item.product = product
          ? Object.fromEntries(
              productFields.map((field) => [field, product[field]])
            )
          : null
      }
      if (variantFields.length) {
        item.variant =
          product && variant?.product_id === item.product_id
            ? Object.fromEntries(
                variantFields.map((field) => [field, variant[field]])
              )
            : null
      }
      if (!itemFields.includes("product_id")) {
        delete item.product_id
      }
      if (!itemFields.includes("variant_id")) {
        delete item.variant_id
      }
    }
  }

  return result
}
