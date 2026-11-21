import { DeleteResponse, DeleteResponseWithParent, PaginatedResponse } from "../../common"
import { StoreCustomer, StoreCustomerAddress, StoreWishlistItem } from "./entities"

export interface StoreCustomerResponse {
  /**
   * The customer's details.
   */
  customer: StoreCustomer
}

export interface StoreCustomerAddressResponse {
  /**
   * The address's details.
   */
  address: StoreCustomerAddress
}

export interface StoreCustomerAddressListResponse
  extends PaginatedResponse<{ 
    /**
     * The paginated list of addresses.
     */
    addresses: StoreCustomerAddress[] 
  }> {}

export type StoreCustomerAddressDeleteResponse = DeleteResponseWithParent<
  "address",
  StoreCustomer
>

export interface StoreWishlistItemResponse {
  wishlist_item: StoreWishlistItem
}

export type StoreWishlistItemListResponse = PaginatedResponse<{
  wishlist_items: StoreWishlistItem[]
}>

export interface StoreWishlistItemDeleteResponse
  extends DeleteResponse<"wishlist_item"> {}
