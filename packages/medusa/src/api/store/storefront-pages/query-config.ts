import { buildAllowedFields } from "../utils/allowed-fields"

export const defaultStoreStorefrontPageFields = [
  "id",
  "slug",
  "title",
  "subtitle",
  "page_type",
  "metadata",
]

export const defaultStoreStorefrontPageDetailFields = [
  ...defaultStoreStorefrontPageFields,
  "sections.id",
  "sections.page_id",
  "sections.type",
  "sections.title",
  "sections.href",
  "sections.rank",
  "sections.is_active",
  "sections.config",
  "sections.metadata",
]

export const listStorefrontPagesQueryConfig = {
  defaults: defaultStoreStorefrontPageFields,
  allowed: buildAllowedFields(defaultStoreStorefrontPageFields),
  defaultLimit: 50,
  isList: true,
}

export const retrieveStorefrontPageQueryConfig = {
  defaults: defaultStoreStorefrontPageDetailFields,
  allowed: buildAllowedFields(defaultStoreStorefrontPageDetailFields),
  isList: false,
}

export const defaultStoreStorefrontColorFields = ["id", "name", "hex_code"]

export const listStorefrontColorsQueryConfig = {
  defaults: defaultStoreStorefrontColorFields,
  allowed: buildAllowedFields(defaultStoreStorefrontColorFields),
  defaultLimit: 500,
  isList: true,
}
