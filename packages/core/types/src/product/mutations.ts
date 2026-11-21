import type { MetadataType } from "../common"
import type { ProductReviewStatus } from "./common"

/** Data used to create a product brand. */
export interface CreateProductBrandDTO {
  name: string
  handle?: string
  logo_url?: string | null
  banner_url?: string | null
  description?: string | null
  is_featured?: boolean
  country?: string | null
  metadata?: MetadataType
}

/** Data used to update a product brand. */
export interface UpdateProductBrandDTO extends Partial<CreateProductBrandDTO> {
  id?: string
}

/** Data used to create a review. */
export interface CreateProductReviewDTO {
  product_id: string
  customer_id?: string | null
  customer_name: string
  rating: number
  title?: string | null
  content: string
  pros?: string[] | null
  cons?: string[] | null
  is_recommended?: boolean
  verified_purchase?: boolean
  status?: ProductReviewStatus
  metadata?: MetadataType
}

/** Data used to update or moderate a review. */
export interface UpdateProductReviewDTO
  extends Partial<
    Omit<CreateProductReviewDTO, "product_id" | "customer_id" | "customer_name">
  > {
  id?: string
}
