import type { MedusaStoreRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listVisibleProducts } from "../utils/visible-products"
import { storeBrandProductFields } from "./query-config"

export async function queryStoreBrands<TQuery>(
  req: MedusaStoreRequest<unknown, TQuery>,
  filters: object
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { fields, pagination } = req.queryConfig
  const brandFields = fields.filter((field) => !/^products(?:\.|$)/.test(field))
  const productFields = fields.flatMap((field) => {
    if (field === "products" || field === "products.*") {
      return storeBrandProductFields
    }
    return field.startsWith("products.")
      ? [field.slice("products.".length)]
      : []
  })

  const result = await query.graph(
    { entity: "product_brand", filters, pagination, fields: brandFields },
    { locale: req.locale }
  )

  // Filter the product expansion without changing the brand page or count.
  if (productFields.length && result.data.length) {
    const products = await listVisibleProducts(
      req,
      { brand_id: result.data.map((brand) => brand.id) },
      [...new Set(["brand_id", ...productFields])]
    )
    const productsByBrand = new Map<string, object[]>()
    for (const { brand_id, ...product } of products) {
      if (!brand_id) {
        continue
      }
      const list = productsByBrand.get(brand_id) ?? []
      list.push(
        productFields.includes("brand_id") ? { ...product, brand_id } : product
      )
      productsByBrand.set(brand_id, list)
    }
    for (const brand of result.data) {
      brand.products = productsByBrand.get(brand.id) ?? []
    }
  }

  return result
}
