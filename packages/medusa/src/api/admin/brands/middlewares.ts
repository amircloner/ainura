import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { authorize, MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminCreateBrand,
  AdminGetBrandParams,
  AdminGetBrandsParams,
  AdminUpdateBrand,
} from "./validators"

export const adminBrandRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/brands",
    middlewares: [
      authorize([
        {
          resource: Entities.product_brand,
          operation: PolicyOperation.read,
        },
      ]),
      validateAndTransformQuery(
        AdminGetBrandsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/brands/:id",
    middlewares: [
      authorize([
        { resource: Entities.product_brand, operation: PolicyOperation.read },
      ]),
      validateAndTransformQuery(
        AdminGetBrandParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands",
    middlewares: [
      authorize([
        {
          resource: Entities.product_brand,
          operation: [PolicyOperation.read, PolicyOperation.create],
        },
      ]),
      validateAndTransformBody(AdminCreateBrand),
      validateAndTransformQuery(
        AdminGetBrandParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.product_brand,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminUpdateBrand),
      validateAndTransformQuery(
        AdminGetBrandParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/brands/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.product_brand,
          operation: [PolicyOperation.read, PolicyOperation.delete],
        },
      ]),
    ],
  },
]
