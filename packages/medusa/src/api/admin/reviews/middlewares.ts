import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { authorize, MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminGetReviewParams,
  AdminGetReviewsParams,
  AdminUpdateReview,
} from "./validators"

export const adminReviewRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/reviews",
    middlewares: [
      authorize([
        {
          resource: Entities.product_review,
          operation: PolicyOperation.read,
        },
      ]),
      validateAndTransformQuery(
        AdminGetReviewsParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/reviews/:id",
    middlewares: [
      authorize([
        { resource: Entities.product_review, operation: PolicyOperation.read },
      ]),
      validateAndTransformQuery(
        AdminGetReviewParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/reviews/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.product_review,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminUpdateReview),
      validateAndTransformQuery(
        AdminGetReviewParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/reviews/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.product_review,
          operation: [PolicyOperation.read, PolicyOperation.delete],
        },
      ]),
    ],
  },
]
