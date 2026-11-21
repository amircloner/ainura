import { HttpTypes, SelectParams } from "@medusajs/types"
import { Client } from "../client.js"
import { ClientHeaders } from "../types.js"

export class StorefrontPage {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  /**
   * List storefront pages.
   *
   * @example
   * sdk.admin.storefrontPage.list()
   */
  async list(
    query?: HttpTypes.AdminStorefrontPageListParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontPageListResponse>(
      `/admin/storefront-pages`,
      { headers, query }
    )
  }

  /**
   * Retrieve a storefront page by ID.
   *
   * @example
   * sdk.admin.storefrontPage.retrieve("sfpage_123")
   */
  async retrieve(
    id: string,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontPageResponse>(
      `/admin/storefront-pages/${id}`,
      { headers, query }
    )
  }

  /**
   * Create a storefront page.
   *
   * @example
   * sdk.admin.storefrontPage.create({ slug: "jackets", title: "کاپشن و پالتو" })
   */
  async create(
    body: HttpTypes.AdminCreateStorefrontPage,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontPageResponse>(
      `/admin/storefront-pages`,
      { method: "POST", body, query, headers }
    )
  }

  /**
   * Update a storefront page.
   *
   * @example
   * sdk.admin.storefrontPage.update("sfpage_123", { title: "صفحه اصلی" })
   */
  async update(
    id: string,
    body: HttpTypes.AdminUpdateStorefrontPage,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontPageResponse>(
      `/admin/storefront-pages/${id}`,
      { method: "POST", body, query, headers }
    )
  }

  /**
   * Delete a storefront page.
   *
   * @example
   * sdk.admin.storefrontPage.delete("sfpage_123")
   */
  async delete(id: string, headers?: ClientHeaders) {
    return this.client.fetch<HttpTypes.AdminStorefrontPageDeleteResponse>(
      `/admin/storefront-pages/${id}`,
      { method: "DELETE", headers }
    )
  }

  /**
   * Add a section to a storefront page.
   *
   * @example
   * sdk.admin.storefrontPage.createSection("sfpage_123", { type: "hero_banner", config: { slides: [] } })
   */
  async createSection(
    pageId: string,
    body: HttpTypes.AdminCreateStorefrontSection,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontSectionResponse>(
      `/admin/storefront-pages/${pageId}/sections`,
      { method: "POST", body, headers }
    )
  }

  /**
   * Update a storefront section.
   *
   * @example
   * sdk.admin.storefrontPage.updateSection("sfpage_123", "sfsec_123", { title: "خوش‌قیمت‌های امروز" })
   */
  async updateSection(
    pageId: string,
    sectionId: string,
    body: HttpTypes.AdminUpdateStorefrontSection,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontSectionResponse>(
      `/admin/storefront-pages/${pageId}/sections/${sectionId}`,
      { method: "POST", body, headers }
    )
  }

  /**
   * Delete a storefront section.
   *
   * @example
   * sdk.admin.storefrontPage.deleteSection("sfpage_123", "sfsec_123")
   */
  async deleteSection(
    pageId: string,
    sectionId: string,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontSectionDeleteResponse>(
      `/admin/storefront-pages/${pageId}/sections/${sectionId}`,
      { method: "DELETE", headers }
    )
  }

  /**
   * Reorder sections on a storefront page.
   *
   * @example
   * sdk.admin.storefrontPage.reorderSections("sfpage_123", { section_ids: ["sfsec_2", "sfsec_1"] })
   */
  async reorderSections(
    pageId: string,
    body: HttpTypes.AdminReorderStorefrontSections,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontPageResponse>(
      `/admin/storefront-pages/${pageId}/sections/reorder`,
      { method: "POST", body, headers }
    )
  }
}

export class StorefrontColor {
  private client: Client

  constructor(client: Client) {
    this.client = client
  }

  /**
   * List storefront color swatches.
   *
   * @example
   * sdk.admin.storefrontColor.list()
   */
  async list(
    query?: HttpTypes.AdminStorefrontColorListParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontColorListResponse>(
      `/admin/storefront-colors`,
      { headers, query }
    )
  }

  /**
   * Create or update a storefront color swatch.
   *
   * @example
   * sdk.admin.storefrontColor.upsert({ name: "آجری", hex_code: "#C45A3F" })
   */
  async upsert(
    body: HttpTypes.AdminUpsertStorefrontColor,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminStorefrontColorResponse>(
      `/admin/storefront-colors`,
      { method: "POST", body, headers }
    )
  }

  /**
   * Delete a storefront color swatch.
   *
   * @example
   * sdk.admin.storefrontColor.delete("sfcol_123")
   */
  async delete(id: string, headers?: ClientHeaders) {
    return this.client.fetch<HttpTypes.AdminStorefrontColorDeleteResponse>(
      `/admin/storefront-colors/${id}`,
      { method: "DELETE", headers }
    )
  }
}
