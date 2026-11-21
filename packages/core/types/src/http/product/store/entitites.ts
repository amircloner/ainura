import { StoreCollection } from "../../collection"
import { StoreProductCategory } from "../../product-category"
import { StoreProductTag } from "../../product-tag"
import { StoreProductType } from "../../product-type"
import {
  BaseProduct,
  BaseProductBrand,
  BaseProductImage,
  BaseProductOption,
  BaseProductOptionValue,
  BaseProductReview,
  BaseProductVariant,
  ProductStatus,
} from "../common"

export interface StoreProduct extends Omit<
  BaseProduct,
  | "categories"
  | "sales_channels"
  | "variants"
  | "options"
  | "collection"
  | "brand"
  | "reviews"
> {
  /** The product's brand. */
  brand?: StoreBrand | null
  /** Approved reviews, when populated by a custom storefront. Core Store routes use the dedicated product reviews endpoint. */
  reviews?: StoreProductReview[]
  /**
   * The product's collection.
   */
  collection?: StoreCollection | null
  /**
   * The product's categories.
   */
  categories?: StoreProductCategory[] | null
  /**
   * The product's variants.
   */
  variants: StoreProductVariant[] | null
  /**
   * The product's types.
   */
  type?: StoreProductType | null
  /**
   * The product's tags.
   */
  tags?: StoreProductTag[] | null
  /**
   * The product's options.
   */
  options: StoreProductOption[] | null
  /**
   * The product's images.
   */
  images: StoreProductImage[] | null
}
export interface StoreProductVariant extends Omit<
  BaseProductVariant,
  "product" | "options"
> {
  /**
   * The variant's values for the product's options.
   */
  options: StoreProductOptionValue[] | null
  /**
   * The variant's product.
   */
  product?: StoreProduct | null
}
export interface StoreProductOption extends Omit<
  BaseProductOption,
  "product" | "values"
> {
  /**
   * The product the option belongs to.
   */
  product?: StoreProduct | null
  /**
   * The option's values.
   */
  values?: StoreProductOptionValue[]
}
export interface StoreProductImage extends BaseProductImage {}
export interface StoreProductOptionValue extends Omit<
  BaseProductOptionValue,
  "option"
> {
  /**
   * The product's option.
   */
  option?: StoreProductOption | null
}
export type StoreProductStatus = ProductStatus

export interface StoreBrand extends BaseProductBrand {
  products?: StoreProduct[]
}

export interface StoreProductReview extends Omit<
  BaseProductReview,
  "customer_id" | "metadata" | "deleted_at"
> {}

export interface StoreProductReviewStats {
  product_id: string
  average_rating: number
  total_count: number
  recommendation_percentage: number
  distribution: Record<1 | 2 | 3 | 4 | 5, number>
}

export interface StoreCreateProductReview {
  rating: number
  title?: string
  content: string
  customer_name?: string
  pros?: string[]
  cons?: string[]
  is_recommended?: boolean
}
