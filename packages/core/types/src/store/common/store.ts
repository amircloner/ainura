import { BaseFilterable, OperatorMap } from "../../dal"

export interface StoreCurrencyDTO {
  /**
   * The ID of the store currency.
   */
  id: string
  /**
   * The currency code of the store currency.
   */
  currency_code: string
  /**
   * Whether the currency is the default one for the store.
   */
  is_default: boolean
  /**
   * The store ID associated with the currency.
   */
  store_id: string
  /**
   * The created date of the currency
   */
  created_at: string
  /**
   * The updated date of the currency
   */
  updated_at: string
  /**
   * The deleted date of the currency
   */
  deleted_at: string | null
}

export interface StoreLocaleDTO {
  /**
   * The ID of the store locale.
   */
  id: string
  /**
   * The locale code of the store locale.
   */
  locale_code: string
  /**
   * The store ID associated with the locale.
   */
  store_id: string
  /**
   * The created date of the locale.
   */
  created_at: string
  /**
   * The updated date of the locale.
   */
  updated_at: string
  /**
   * The deleted date of the locale.
   */
  deleted_at: string | null
}

/**
 * The store details.
 */
export interface StoreDTO {
  /**
   * The ID of the store.
   */
  id: string

  /**
   * The name of the store.
   */
  name: string

  /**
   * The supported currency codes of the store.
   */
  supported_currencies?: StoreCurrencyDTO[]

  /**
   * The supported locale codes of the store.
   */
  supported_locales?: StoreLocaleDTO[]

  /**
   * The associated default sales channel's ID.
   */
  default_sales_channel_id?: string

  /**
   * The associated default region's ID.
   */
  default_region_id?: string

  /**
   * The associated default location's ID.
   */
  default_location_id?: string

  /**
   * Holds custom data in key-value pairs.
   */
  metadata: Record<string, any> | null

  /**
   * The created at of the store.
   */
  created_at: string

  /**
   * The updated at of the store.
   */
  updated_at: string
}

/**
 * The filters to apply on the retrieved stores.
 */
export interface FilterableStoreProps extends BaseFilterable<FilterableStoreProps> {
  /**
   * Find stores by name through this search term.
   */
  q?: string
  /**
   * The IDs to filter the stores by.
   */
  id?: string | string[]

  /**
   * Filter stores by their names.
   */
  name?: string | string[]
  /**
   * Filter stores by their associated default sales channel's ID.
   */
  default_sales_channel_id?: string | string[] | OperatorMap<string | string[]>
}

export type StorefrontPageType = "home" | "landing"

export type StorefrontSectionType =
  | "hero_banner"
  | "category_row"
  | "brand_marquee"
  | "amazing_carousel"
  | "tab_carousel"
  | "simple_carousel"
  | "two_banner"
  | "four_banner"
  | "trust_badges"

export interface StorefrontProductSource {
  mode: "manual" | "filter" | "hybrid"
  product_ids?: string[]
  category_id?: string | null
  brand_id?: string | null
  collection_id?: string | null
  on_sale?: boolean
  sort?: "newest" | "discount" | "price_asc" | "price_desc"
  limit?: number
}

export interface StorefrontBannerItem {
  desktop_image: string
  mobile_image?: string
  href: string
  alt?: string
}

export interface StorefrontTileItem {
  title: string
  image: string
  href?: string
}

export interface StorefrontBrandBannerItem {
  image: string
  href: string
  alt?: string
}

export interface StorefrontTabConfig {
  title: string
  href?: string
  source: StorefrontProductSource
}

export interface StorefrontSectionConfig {
  slides?: StorefrontBannerItem[]
  banners?: StorefrontBannerItem[]
  items?: StorefrontTileItem[]
  brand_items?: StorefrontBrandBannerItem[]
  reverse?: boolean
  end_date_time?: string | null
  source?: StorefrontProductSource
  tabs?: StorefrontTabConfig[]
}

export interface StorefrontSectionDTO {
  id: string
  page_id: string
  page?: StorefrontPageDTO
  type: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank: number
  is_active: boolean
  config: StorefrontSectionConfig
  metadata?: Record<string, unknown> | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at?: string | Date | null
}

export interface StorefrontPageDTO {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  page_type: StorefrontPageType
  is_active: boolean
  sections?: StorefrontSectionDTO[]
  metadata?: Record<string, unknown> | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at?: string | Date | null
}

export interface StorefrontColorDTO {
  id: string
  name: string
  hex_code: string
  metadata?: Record<string, unknown> | null
  created_at: string | Date
  updated_at: string | Date
  deleted_at?: string | Date | null
}

export interface FilterableStorefrontPageProps
  extends BaseFilterable<FilterableStorefrontPageProps> {
  q?: string
  id?: string | string[] | OperatorMap<string | string[]>
  slug?: string | string[] | OperatorMap<string | string[]>
  page_type?: StorefrontPageType | StorefrontPageType[]
  is_active?: boolean
}

export interface FilterableStorefrontSectionProps
  extends BaseFilterable<FilterableStorefrontSectionProps> {
  id?: string | string[] | OperatorMap<string | string[]>
  page_id?: string | string[] | OperatorMap<string | string[]>
  type?: StorefrontSectionType | StorefrontSectionType[]
  is_active?: boolean
}

export interface FilterableStorefrontColorProps
  extends BaseFilterable<FilterableStorefrontColorProps> {
  q?: string
  id?: string | string[] | OperatorMap<string | string[]>
  name?: string | string[] | OperatorMap<string | string[]>
}
