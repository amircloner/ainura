import { model } from "@medusajs/framework/utils"
import Product from "./product"

const ProductBrand = model
  .define("ProductBrand", {
    id: model.id({ prefix: "pbrand" }).primaryKey(),
    name: model.text().searchable().translatable(),
    handle: model.text(),
    logo_url: model.text().nullable(),
    banner_url: model.text().nullable(),
    description: model.text().searchable().translatable().nullable(),
    is_featured: model.boolean().default(false),
    country: model.text().nullable(),
    metadata: model.json().nullable(),
    products: model.hasMany(() => Product, {
      mappedBy: "brand",
    }),
  })
  .indexes([
    {
      name: "IDX_brand_handle_unique",
      on: ["handle"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default ProductBrand
