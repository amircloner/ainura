import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import {
  filterByValidSalesChannels,
  normalizeDataForContext,
  setPricingContext,
  setTaxContext,
} from "../../utils/middlewares"
import * as QueryConfig from "./query-config"
import { createFindParams } from "../../utils/validators"
import {
  StoreGetStorefrontPageParams,
  StoreGetStorefrontPagesParams,
} from "./validators"

const StoreGetStorefrontColorsParams = createFindParams({
  limit: 500,
  offset: 0,
})

export const storeStorefrontRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/storefront-pages",
    middlewares: [
      validateAndTransformQuery(
        StoreGetStorefrontPagesParams,
        QueryConfig.listStorefrontPagesQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/storefront-pages/:slug",
    middlewares: [
      validateAndTransformQuery(
        StoreGetStorefrontPageParams,
        QueryConfig.retrieveStorefrontPageQueryConfig
      ),
      filterByValidSalesChannels(),
      normalizeDataForContext(),
      setPricingContext(),
      setTaxContext(),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/storefront-colors",
    middlewares: [
      validateAndTransformQuery(
        StoreGetStorefrontColorsParams,
        QueryConfig.listStorefrontColorsQueryConfig
      ),
    ],
  },
]
