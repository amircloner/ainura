import { buildAllowedFields } from "../../../utils/allowed-fields"

export const defaultStoreProductReviewFields = [
  "id",
  "product_id",
  "customer_name",
  "rating",
  "title",
  "content",
  "pros",
  "cons",
  "is_recommended",
  "verified_purchase",
  "status",
  "created_at",
  "updated_at",
]

export const retrieveProductReviewQueryConfig = {
  defaults: defaultStoreProductReviewFields,
  allowed: buildAllowedFields(defaultStoreProductReviewFields),
  isList: false,
}

export const listProductReviewQueryConfig = {
  ...retrieveProductReviewQueryConfig,
  defaultLimit: 20,
  isList: true,
}
