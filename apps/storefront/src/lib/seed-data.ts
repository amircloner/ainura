import type { HttpTypes, ProductFashionMetadata } from "@medusajs/types"

export type CatalogBrand = Pick<
  HttpTypes.StoreBrand,
  | "id"
  | "name"
  | "handle"
  | "logo_url"
  | "banner_url"
  | "description"
  | "is_featured"
  | "country"
>

export type CatalogCategory = {
  handle: string
  name: string
  parent?: CatalogCategory
}

export type CatalogReview = Pick<
  HttpTypes.StoreProductReview,
  | "id"
  | "customer_name"
  | "rating"
  | "title"
  | "content"
  | "pros"
  | "cons"
  | "is_recommended"
  | "verified_purchase"
  | "created_at"
>

export type ReviewStats = HttpTypes.StoreProductReviewStats

export type CatalogVariant = {
  id: string
  color: string
  size: string
  price: number
  originalPrice: number
  available: boolean
}

export type CatalogProduct = {
  id: string
  handle: string
  title: string
  description: string
  category: CatalogCategory
  brand: CatalogBrand | null
  images: string[]
  variants: CatalogVariant[]
  metadata: ProductFashionMetadata
  currency?: string
  created_at: string
  featured?: boolean
  bestSeller?: boolean
  demo?: boolean
}

export type DynamicStorefrontSection = Omit<
  HttpTypes.StoreStorefrontSection,
  "products" | "tabs"
> & {
  products?: CatalogProduct[]
  tabs?: Array<{
    title: string
    href?: string
    products: CatalogProduct[]
  }>
}

export type DynamicStorefrontPage = Omit<
  HttpTypes.StoreStorefrontPage,
  "sections"
> & {
  sections: DynamicStorefrontSection[]
}
