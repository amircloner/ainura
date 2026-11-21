import { HttpTypes, SelectParams } from "@medusajs/types"
import { Client } from "../client.js"
import { ClientHeaders } from "../types.js"

export class Brand {
  /**
   * @ignore
   */
  private client: Client

  /**
   * @ignore
   */
  constructor(client: Client) {
    this.client = client
  }

  /**
   * Create a product brand.
   *
   * @example
   * sdk.admin.brand.create({ name: "Yelsan" })
   */
  async create(
    body: HttpTypes.AdminCreateBrand,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminBrandResponse>(`/admin/brands`, {
      method: "POST",
      headers,
      body,
      query,
    })
  }

  /**
   * Update a product brand.
   *
   * @example
   * sdk.admin.brand.update("pbrand_123", { name: "Yelsan Leather" })
   */
  async update(
    id: string,
    body: HttpTypes.AdminUpdateBrand,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminBrandResponse>(
      `/admin/brands/${id}`,
      {
        method: "POST",
        headers,
        body,
        query,
      }
    )
  }

  /**
   * List product brands.
   *
   * @example
   * sdk.admin.brand.list()
   */
  async list(
    queryParams?: HttpTypes.AdminBrandListParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminBrandListResponse>(
      `/admin/brands`,
      {
        headers,
        query: queryParams,
      }
    )
  }

  /**
   * Retrieve a product brand by ID.
   *
   * @example
   * sdk.admin.brand.retrieve("pbrand_123")
   */
  async retrieve(
    id: string,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminBrandResponse>(
      `/admin/brands/${id}`,
      {
        query,
        headers,
      }
    )
  }

  /**
   * Delete a product brand.
   *
   * @example
   * sdk.admin.brand.delete("pbrand_123")
   */
  async delete(id: string, headers?: ClientHeaders) {
    return this.client.fetch<HttpTypes.AdminBrandDeleteResponse>(
      `/admin/brands/${id}`,
      {
        method: "DELETE",
        headers,
      }
    )
  }
}
