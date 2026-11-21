export enum Entities {
  storefront_page = "storefront_page",
  storefront_section = "storefront_section",
  storefront_color = "storefront_color",
}

export const defaultAdminStorefrontPageFields = [
  "id",
  "slug",
  "title",
  "subtitle",
  "page_type",
  "is_active",
  "metadata",
  "created_at",
  "updated_at",
  "*sections",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminStorefrontPageFields,
  isList: false,
  entity: Entities.storefront_page,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 50,
  isList: true,
  entity: Entities.storefront_page,
}

export const defaultAdminStorefrontColorFields = [
  "id",
  "name",
  "hex_code",
  "metadata",
  "created_at",
  "updated_at",
]

export const listColorsTransformQueryConfig = {
  defaults: defaultAdminStorefrontColorFields,
  defaultLimit: 200,
  isList: true,
  entity: Entities.storefront_color,
}
