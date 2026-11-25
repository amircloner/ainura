/**
 * The data to create a product tag.
 */
export interface AdminCreateProductTag {
  /**
   * The tag's value.
   */
  value: string
  /**
   * The tag's unique URL slug/handle. Auto-generated from value if omitted.
   */
  handle?: string | null
  /**
   * The tag's description.
   */
  description?: string
  /**
   * An external ID for the tag.
   *
   * @since 2.13.7
   */
  external_id?: string | null
  /**
   * Key-value pairs of custom data.
   */
  metadata?: Record<string, unknown> | null
}

/**
 * The data to update a product tag.
 */
export interface AdminUpdateProductTag {
  /**
   * The tag's value.
   */
  value?: string
  /**
   * The tag's unique URL slug/handle.
   */
  handle?: string | null
  /**
   * The tag's description.
   */
  description?: string
  /**
   * An external ID for the tag.
   *
   * @since 2.13.7
   */
  external_id?: string | null
  /**
   * Key-value pairs of custom data.
   */
  metadata?: Record<string, unknown> | null
}
