import { StoreProduct, StoreProductVariant } from "../../product"
import { BaseCustomer, BaseCustomerAddress } from "../common"

export interface StoreCustomer extends Omit<BaseCustomer, "created_by"> {
  /**
   * The customer's address.
   */
  addresses: StoreCustomerAddress[]
}
export interface StoreCustomerAddress extends BaseCustomerAddress {}

export interface StoreWishlistItem {
  id: string
  customer_id: string
  product_id: string
  variant_id?: string | null
  product?: StoreProduct | null
  variant?: StoreProductVariant | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
}
