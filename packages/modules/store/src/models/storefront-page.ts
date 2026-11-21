import { model } from "@medusajs/framework/utils"
import StorefrontSection from "./storefront-section"

const StorefrontPage = model
  .define("StorefrontPage", {
    id: model.id({ prefix: "sfpage" }).primaryKey(),
    slug: model.text(),
    title: model.text().searchable().translatable(),
    subtitle: model.text().searchable().translatable().nullable(),
    page_type: model.enum(["home", "landing"]).default("landing"),
    is_active: model.boolean().default(true),
    metadata: model.json().nullable(),
    sections: model.hasMany(() => StorefrontSection, {
      mappedBy: "page",
    }),
  })
  .cascades({
    delete: ["sections"],
  })
  .indexes([
    {
      name: "IDX_storefront_page_slug_unique",
      on: ["slug"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default StorefrontPage
