import * as QueryConfig from "./query-config"

import {
  StoreCreateCustomer,
  StoreCreateCustomerAddress,
  StoreCreateWishlistItem,
  StoreGetCustomerAddressesParams,
  StoreGetCustomerAddressParams,
  StoreGetCustomerParams,
  StoreGetWishlistParams,
  StoreUpdateCustomer,
  StoreUpdateCustomerAddress,
} from "./validators"

import { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "../../../utils/middlewares/authenticate-middleware"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"

export const storeCustomerRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/customers",
    middlewares: [
      authenticate("customer", ["session", "bearer"], {
        allowUnregistered: true,
      }),
      validateAndTransformBody(StoreCreateCustomer),
      validateAndTransformQuery(
        StoreGetCustomerParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: "ALL",
    matcher: "/store/customers/me{*splat}",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
  {
    method: ["GET"],
    matcher: "/store/customers/me",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCustomerParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/customers/me",
    middlewares: [
      validateAndTransformBody(StoreUpdateCustomer),
      validateAndTransformQuery(
        StoreGetCustomerParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/customers/me/addresses",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCustomerAddressesParams,
        QueryConfig.listAddressesTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/customers/me/addresses",
    middlewares: [
      validateAndTransformBody(StoreCreateCustomerAddress),
      validateAndTransformQuery(
        StoreGetCustomerParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/customers/me/addresses/:address_id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCustomerAddressParams,
        QueryConfig.retrieveAddressTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/customers/me/addresses/:address_id",
    middlewares: [
      validateAndTransformBody(StoreUpdateCustomerAddress),
      validateAndTransformQuery(
        StoreGetCustomerParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/customers/me/addresses/:address_id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetCustomerAddressParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/customers/me/wishlist",
    middlewares: [
      validateAndTransformQuery(
        StoreGetWishlistParams,
        QueryConfig.listWishlistTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/customers/me/wishlist",
    middlewares: [
      validateAndTransformBody(StoreCreateWishlistItem),
      validateAndTransformQuery(
        StoreGetCustomerParams,
        QueryConfig.retrieveWishlistTransformQueryConfig
      ),
    ],
  },
]
