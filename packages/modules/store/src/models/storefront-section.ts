import { model } from "@medusajs/framework/utils"
import StorefrontPage from "./storefront-page"

const StorefrontSection = model
  .define("StorefrontSection", {
    id: model.id({ prefix: "sfsec" }).primaryKey(),
    page: model.belongsTo(() => StorefrontPage, {
      mappedBy: "sections",
    }),
    type: model.enum([
      "hero_banner",
      "category_row",
      "brand_marquee",
      "amazing_carousel",
      "tab_carousel",
      "simple_carousel",
      "two_banner",
      "four_banner",
      "trust_badges",
    ]),
    title: model.text().searchable().translatable().nullable(),
    href: model.text().nullable(),
    rank: model.number().default(0),
    is_active: model.boolean().default(true),
    config: model.json().default({}),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_storefront_section_page_rank",
      on: ["page_id", "rank"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ])

export default StorefrontSection
