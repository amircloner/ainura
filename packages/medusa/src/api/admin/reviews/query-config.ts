export enum Entities {
  product_review = "product_review",
  product = "product",
}

export const defaultAdminReviewFields = [
  "id",
  "product_id",
  "customer_id",
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
  "metadata",
  "*product",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminReviewFields,
  isList: false,
  entity: Entities.product_review,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 20,
  isList: true,
  entity: Entities.product_review,
}
