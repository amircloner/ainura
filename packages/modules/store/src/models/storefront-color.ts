import { model } from "@medusajs/framework/utils"

const StorefrontColor = model
  .define("StorefrontColor", {
    id: model.id({ prefix: "sfcol" }).primaryKey(),
    name: model.text().searchable(),
    hex_code: model.text(),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_storefront_color_name_unique",
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default StorefrontColor
