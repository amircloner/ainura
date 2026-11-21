export enum Entities {
  product_brand = "product_brand",
  product = "product",
}

export const defaultAdminBrandFields = [
  "id",
  "name",
  "handle",
  "logo_url",
  "banner_url",
  "description",
  "is_featured",
  "country",
  "created_at",
  "updated_at",
  "metadata",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminBrandFields,
  isList: false,
  entity: Entities.product_brand,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 20,
  isList: true,
  entity: Entities.product_brand,
}
