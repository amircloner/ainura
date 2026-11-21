import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  buildAllowedFields,
  prefixAllowedFields,
} from "../utils/allowed-fields"

export const defaultStoreBrandFields = [
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
]

export const storeBrandProductFields = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "thumbnail",
  "brand_id",
]

export const allowedStoreBrandExtraFields = [
  "products",
  ...prefixAllowedFields("products", storeBrandProductFields),
]

export const storeProductBrandFields = prefixAllowedFields(
  "brand",
  defaultStoreBrandFields
)

export function expandStoreBrandFields(
  req: MedusaRequest,
  _: MedusaResponse,
  next: MedusaNextFunction
) {
  req.queryConfig.fields = [
    ...new Set(
      req.queryConfig.fields.flatMap((field) =>
        field === "brand.*" || field === "brand"
          ? storeProductBrandFields
          : [field]
      )
    ),
  ]
  next()
}

export const retrieveTransformQueryConfig = {
  defaults: defaultStoreBrandFields,
  allowed: buildAllowedFields(
    defaultStoreBrandFields,
    allowedStoreBrandExtraFields
  ),
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 20,
  isList: true,
}
