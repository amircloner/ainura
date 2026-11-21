import { z } from "@medusajs/framework/zod"
import { createFindParams, createSelectParams } from "../../utils/validators"
import { booleanString } from "../../utils/common-validators"

const StorefrontPageTypeEnum = z.enum(["home", "landing"])

export const StorefrontSectionTypeEnum = z.enum([
  "hero_banner",
  "category_row",
  "brand_marquee",
  "amazing_carousel",
  "tab_carousel",
  "simple_carousel",
  "two_banner",
  "four_banner",
  "trust_badges",
])

const ProductSourceSchema = z.object({
  mode: z.enum(["manual", "filter", "hybrid"]).default("hybrid"),
  product_ids: z.array(z.string()).optional(),
  category_id: z.string().nullish(),
  brand_id: z.string().nullish(),
  collection_id: z.string().nullish(),
  on_sale: z.boolean().optional(),
  sort: z.enum(["newest", "discount", "price_asc", "price_desc"]).optional(),
  limit: z.number().int().min(1).max(48).optional(),
})

const BannerItemSchema = z.object({
  desktop_image: z.string().min(1),
  mobile_image: z.string().optional(),
  href: z.string().default("/products"),
  alt: z.string().optional(),
})

const TileItemSchema = z.object({
  title: z.string().min(1),
  image: z.string().min(1),
  href: z.string().optional(),
})

const BrandBannerItemSchema = z.object({
  image: z.string().min(1),
  href: z.string().default("/products"),
  alt: z.string().optional(),
})

const TabConfigSchema = z.object({
  title: z.string().min(1),
  href: z.string().optional(),
  source: ProductSourceSchema,
})

const SectionConfigSchema = z
  .object({
    slides: z.array(BannerItemSchema).optional(),
    banners: z.array(BannerItemSchema).optional(),
    items: z.array(TileItemSchema).optional(),
    brand_items: z.array(BrandBannerItemSchema).optional(),
    reverse: z.boolean().optional(),
    end_date_time: z.string().nullish(),
    source: ProductSourceSchema.optional(),
    tabs: z.array(TabConfigSchema).optional(),
  })
  .passthrough()

export const AdminGetStorefrontPageParams = createSelectParams()

export const AdminGetStorefrontPagesParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    slug: z.union([z.string(), z.array(z.string())]).optional(),
    page_type: z
      .union([StorefrontPageTypeEnum, z.array(StorefrontPageTypeEnum)])
      .optional(),
    is_active: booleanString().optional(),
  })
)

export const AdminCreateStorefrontPage = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().nullish(),
  page_type: StorefrontPageTypeEnum.optional().default("landing"),
  is_active: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminUpdateStorefrontPage = z.object({
  slug: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  subtitle: z.string().nullish(),
  page_type: StorefrontPageTypeEnum.optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminCreateStorefrontSection = z.object({
  type: StorefrontSectionTypeEnum,
  title: z.string().nullish(),
  href: z.string().nullish(),
  rank: z.number().int().min(0).optional(),
  is_active: z.boolean().optional().default(true),
  config: SectionConfigSchema.optional().default({}),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminUpdateStorefrontSection = z.object({
  type: StorefrontSectionTypeEnum.optional(),
  title: z.string().nullish(),
  href: z.string().nullish(),
  rank: z.number().int().min(0).optional(),
  is_active: z.boolean().optional(),
  config: SectionConfigSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminReorderStorefrontSections = z.object({
  section_ids: z.array(z.string().min(1)).min(1),
})

export const AdminGetStorefrontColorsParams = createFindParams({
  limit: 200,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    id: z.union([z.string(), z.array(z.string())]).optional(),
    name: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export const AdminUpsertStorefrontColor = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  hex_code: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color code"),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export type AdminCreateStorefrontPageType = z.infer<
  typeof AdminCreateStorefrontPage
>
export type AdminUpdateStorefrontPageType = z.infer<
  typeof AdminUpdateStorefrontPage
>
export type AdminCreateStorefrontSectionType = z.infer<
  typeof AdminCreateStorefrontSection
>
export type AdminUpdateStorefrontSectionType = z.infer<
  typeof AdminUpdateStorefrontSection
>
export type AdminReorderStorefrontSectionsType = z.infer<
  typeof AdminReorderStorefrontSections
>
export type AdminUpsertStorefrontColorType = z.infer<
  typeof AdminUpsertStorefrontColor
>
