import {
  AdminProduct,
  AdminProductCategory,
  AdminShippingProfile,
} from "@medusajs/types"
import { getLinkedFields } from "../../../dashboard-app"

export const PRODUCT_DETAIL_FIELDS = getLinkedFields(
  "product",
  "*categories,*shipping_profile,+brand.id,+brand.name,-variants"
)

export type ExtendedProduct = AdminProduct & {
  categories?: AdminProductCategory[]
  shipping_profile?: AdminShippingProfile
}
