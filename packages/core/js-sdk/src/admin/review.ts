import { HttpTypes, SelectParams } from "@medusajs/types"
import { Client } from "../client.js"
import { ClientHeaders } from "../types.js"

export class Review {
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
   * List product reviews.
   *
   * @example
   * sdk.admin.review.list()
   */
  async list(
    queryParams?: HttpTypes.AdminProductReviewListParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminProductReviewListResponse>(
      `/admin/reviews`,
      {
        headers,
        query: queryParams,
      }
    )
  }

  /**
   * Retrieve a product review by ID.
   *
   * @example
   * sdk.admin.review.retrieve("prev_123")
   */
  async retrieve(
    id: string,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminProductReviewResponse>(
      `/admin/reviews/${id}`,
      {
        query,
        headers,
      }
    )
  }

  /**
   * Update a product review (e.g. moderate status).
   *
   * @example
   * sdk.admin.review.update("prev_123", { status: "approved" })
   */
  async update(
    id: string,
    body: HttpTypes.AdminUpdateProductReview,
    query?: SelectParams,
    headers?: ClientHeaders
  ) {
    return this.client.fetch<HttpTypes.AdminProductReviewResponse>(
      `/admin/reviews/${id}`,
      {
        method: "POST",
        headers,
        body,
        query,
      }
    )
  }

  /**
   * Delete a product review.
   *
   * @example
   * sdk.admin.review.delete("prev_123")
   */
  async delete(id: string, headers?: ClientHeaders) {
    return this.client.fetch<HttpTypes.AdminProductReviewDeleteResponse>(
      `/admin/reviews/${id}`,
      {
        method: "DELETE",
        headers,
      }
    )
  }
}
