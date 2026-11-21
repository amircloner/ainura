import { validateAndTransformQuery } from "@medusajs/framework"
import { MiddlewareRoute } from "@medusajs/framework/http"
import * as QueryConfig from "./query-config"
import { StoreGetBrandParams, StoreGetBrandsParams } from "./validators"

export const storeBrandRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/brands",
    middlewares: [
      validateAndTransformQuery(
        StoreGetBrandsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/brands/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreGetBrandParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
]
