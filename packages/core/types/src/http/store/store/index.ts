import type {
  StorefrontPageType,
  StorefrontSectionConfig,
  StorefrontSectionType,
} from "../../../store/common/store"
import type { FindParams, PaginatedResponse, SelectParams } from "../../common"
import type { StoreProduct } from "../../product/store/entitites"

export interface StoreStorefrontResolvedTab {
  title: string
  href?: string
  products: StoreProduct[]
}

export interface StoreStorefrontSection {
  id: string
  page_id: string
  type: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank: number
  config: StorefrontSectionConfig
  products?: StoreProduct[]
  tabs?: StoreStorefrontResolvedTab[]
  metadata?: Record<string, unknown> | null
}

export interface StoreStorefrontPage {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  page_type: StorefrontPageType
  sections?: StoreStorefrontSection[]
  metadata?: Record<string, unknown> | null
}

export interface StoreStorefrontColor {
  id: string
  name: string
  hex_code: string
}

export interface StoreStorefrontPageListParams extends FindParams {
  page_type?: StorefrontPageType | StorefrontPageType[]
  slug?: string | string[]
}

export interface StoreStorefrontPageParams extends SelectParams {
  region_id?: string
  country_code?: string
  currency_code?: string
}

export interface StoreStorefrontPageResponse {
  storefront_page: StoreStorefrontPage
}

export interface StoreStorefrontPageListResponse
  extends PaginatedResponse<{
    storefront_pages: StoreStorefrontPage[]
  }> {}

export interface StoreStorefrontColorListResponse {
  storefront_colors: StoreStorefrontColor[]
}
