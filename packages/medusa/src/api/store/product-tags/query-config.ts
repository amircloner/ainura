import {
  allowedStoreProductExtraFields,
  defaultStoreProductFields,
} from "../products/query-config"
import {
  buildAllowedFields,
  prefixAllowedFields,
} from "../utils/allowed-fields"

export const defaults = [
  "id",
  "value",
  "handle",
  "description",
  "external_id",
  "created_at",
  "updated_at",
  "metadata",
  "*products",
]

const allowed = buildAllowedFields(
  defaults,
  prefixAllowedFields(
    "products",
    defaultStoreProductFields,
    allowedStoreProductExtraFields
  )
)

export const retrieveProductTagConfig = {
  defaults,
  allowed,
  isList: false,
}

export const listProductTagConfig = {
  defaults,
  allowed,
  defaultLimit: 50,
  isList: true,
}
