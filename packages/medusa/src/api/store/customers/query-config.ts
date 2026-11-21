import { storeBrandProductFields } from "../brands/query-config"
import {
  buildAllowedFields,
  prefixAllowedFields,
} from "../utils/allowed-fields"

const defaultStoreCustomersFields = [
  "id",
  "email",
  "company_name",
  "first_name",
  "last_name",
  "phone",
  "metadata",
  "has_account",
  "deleted_at",
  "created_at",
  "updated_at",
  "*addresses",
]

export const defaultStoreCustomerAddressFields = [
  "id",
  "address_name",
  "company",
  "customer_id",
  "first_name",
  "last_name",
  "address_1",
  "address_2",
  "city",
  "province",
  "postal_code",
  "country_code",
  "phone",
  "metadata",
  "is_default_shipping",
  "is_default_billing",
  "created_at",
  "updated_at",
]

const nestedStoreCustomerAddressFields = prefixAllowedFields(
  "addresses",
  defaultStoreCustomerAddressFields
)

export const retrieveTransformQueryConfig = {
  defaults: defaultStoreCustomersFields,
  allowed: buildAllowedFields(
    defaultStoreCustomersFields,
    ["orders"],
    nestedStoreCustomerAddressFields
  ),
  isList: false,
}

export const retrieveAddressTransformQueryConfig = {
  defaults: defaultStoreCustomerAddressFields,
  allowed: buildAllowedFields(defaultStoreCustomerAddressFields),
  isList: false,
}

export const listAddressesTransformQueryConfig = {
  ...retrieveAddressTransformQueryConfig,
  isList: true,
}

export const defaultStoreWishlistItemFields = [
  "id",
  "customer_id",
  "product_id",
  "variant_id",
  "metadata",
  "created_at",
  "updated_at",
]

export const storeWishlistProductFields = [
  ...storeBrandProductFields,
  "metadata",
]
export const storeWishlistVariantFields = ["id", "title", "sku", "product_id"]

const allowedStoreWishlistExtraFields = [
  "product",
  "variant",
  ...prefixAllowedFields("product", storeWishlistProductFields),
  ...prefixAllowedFields("variant", storeWishlistVariantFields),
]

export const retrieveWishlistTransformQueryConfig = {
  defaults: defaultStoreWishlistItemFields,
  allowed: buildAllowedFields(
    defaultStoreWishlistItemFields,
    allowedStoreWishlistExtraFields
  ),
  isList: false,
}

export const listWishlistTransformQueryConfig = {
  ...retrieveWishlistTransformQueryConfig,
  defaultLimit: 50,
  isList: true,
}
