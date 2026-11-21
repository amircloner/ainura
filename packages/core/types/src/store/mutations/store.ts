export interface CreateStoreCurrencyDTO {
  /**
   * The currency code of the store currency.
   */
  currency_code: string
  /**
   * Whether the currency is the default one for the store.
   */
  is_default?: boolean
}

export interface CreateStoreLocaleDTO {
  /**
   * The locale code of the store locale.
   */
  locale_code: string
}

/**
 * The store to be created.
 */
export interface CreateStoreDTO {
  /**
   * The name of the store.
   */
  name?: string

  /**
   * The supported currency codes of the store.
   */
  supported_currencies?: CreateStoreCurrencyDTO[]

  /**
   * The suppoprted locale codes of the store.
   */
  supported_locales?: CreateStoreLocaleDTO[]

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
  metadata?: Record<string, any>
}

/**
 * The attributes in the store to be created or updated.
 */
export interface UpsertStoreDTO extends UpdateStoreDTO {
  /**
   * The ID of the store when doing an update.
   */
  id?: string
}

/**
 * The attributes to update in the store.
 */
export interface UpdateStoreDTO {
  /**
   * The name of the store.
   */
  name?: string

  /**
   * The supported currency codes of the store.
   */
  supported_currencies?: CreateStoreCurrencyDTO[]

  /**
   * The supported locale codes of the store.
   */
  supported_locales?: CreateStoreLocaleDTO[]

  /**
   * The associated default sales channel's ID.
   */
  default_sales_channel_id?: string | null

  /**
   * The associated default region's ID.
   */
  default_region_id?: string | null

  /**
   * The associated default location's ID.
   */
  default_location_id?: string | null

  /**
   * Holds custom data in key-value pairs.
   */
  metadata?: Record<string, any> | null
}

import type {
  StorefrontPageType,
  StorefrontSectionConfig,
  StorefrontSectionType,
} from "../common/store"

export interface CreateStorefrontPageDTO {
  slug: string
  title: string
  subtitle?: string | null
  page_type?: StorefrontPageType
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface UpdateStorefrontPageDTO {
  slug?: string
  title?: string
  subtitle?: string | null
  page_type?: StorefrontPageType
  is_active?: boolean
  metadata?: Record<string, unknown> | null
}

export interface CreateStorefrontSectionDTO {
  page_id: string
  type: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank?: number
  is_active?: boolean
  config?: StorefrontSectionConfig
  metadata?: Record<string, unknown> | null
}

export interface UpdateStorefrontSectionDTO {
  page_id?: string
  type?: StorefrontSectionType
  title?: string | null
  href?: string | null
  rank?: number
  is_active?: boolean
  config?: StorefrontSectionConfig
  metadata?: Record<string, unknown> | null
}

export interface CreateStorefrontColorDTO {
  name: string
  hex_code: string
  metadata?: Record<string, unknown> | null
}

export interface UpdateStorefrontColorDTO {
  name?: string
  hex_code?: string
  metadata?: Record<string, unknown> | null
}
