import type {
  StorefrontPageType,
  StorefrontSectionConfig,
  StorefrontSectionType,
} from "../../../store/common/store"
import type { DeleteResponse, FindParams, PaginatedResponse, SelectParams } from "../../common"

export interface AdminStorefrontSection {
  id: string
  page_id: string
  type: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank: number
  is_active: boolean
  config: StorefrontSectionConfig
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface AdminStorefrontPage {
  id: string
  slug: string
  title: string
  subtitle?: string | null
  page_type: StorefrontPageType
  is_active: boolean
  sections?: AdminStorefrontSection[]
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface AdminStorefrontColor {
  id: string
  name: string
  hex_code: string
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export interface AdminStorefrontPageListParams extends FindParams {
  q?: string
  id?: string | string[]
  slug?: string | string[]
  page_type?: StorefrontPageType | StorefrontPageType[]
  is_active?: boolean
}

export interface AdminStorefrontPageParams extends SelectParams {}

export interface AdminStorefrontColorListParams extends FindParams {
  q?: string
  id?: string | string[]
  name?: string | string[]
}

export interface AdminCreateStorefrontPage {
  slug: string
  title: string
  subtitle?: string | null
  page_type?: StorefrontPageType
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateStorefrontPage {
  slug?: string
  title?: string
  subtitle?: string | null
  page_type?: StorefrontPageType
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface AdminCreateStorefrontSection {
  type: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank?: number
  is_active?: boolean
  config?: StorefrontSectionConfig
  metadata?: Record<string, unknown> | null
}

export interface AdminUpdateStorefrontSection {
  type?: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank?: number
  is_active?: boolean
  config?: StorefrontSectionConfig
  metadata?: Record<string, unknown> | null
}

export interface AdminReorderStorefrontSections {
  section_ids: string[]
}

export interface AdminUpsertStorefrontColor {
  id?: string
  name: string
  hex_code: string
  metadata?: Record<string, unknown> | null
}

export interface AdminStorefrontPageResponse {
  storefront_page: AdminStorefrontPage
}

export interface AdminStorefrontPageListResponse
  extends PaginatedResponse<{
    storefront_pages: AdminStorefrontPage[]
  }> {}

export interface AdminStorefrontPageDeleteResponse
  extends DeleteResponse<"storefront_page"> {}

export interface AdminStorefrontSectionResponse {
  storefront_section: AdminStorefrontSection
}

export interface AdminStorefrontSectionDeleteResponse
  extends DeleteResponse<"storefront_section"> {}

export interface AdminStorefrontColorResponse {
  storefront_color: AdminStorefrontColor
}

export interface AdminStorefrontColorListResponse
  extends PaginatedResponse<{
    storefront_colors: AdminStorefrontColor[]
  }> {}

export interface AdminStorefrontColorDeleteResponse
  extends DeleteResponse<"storefront_color"> {}
