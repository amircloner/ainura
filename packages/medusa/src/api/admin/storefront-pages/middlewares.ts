import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework"
import { authorize, MiddlewareRoute } from "@medusajs/framework/http"
import { PolicyOperation } from "@medusajs/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminCreateStorefrontPage,
  AdminCreateStorefrontSection,
  AdminGetStorefrontColorsParams,
  AdminGetStorefrontPageParams,
  AdminGetStorefrontPagesParams,
  AdminReorderStorefrontSections,
  AdminUpdateStorefrontPage,
  AdminUpdateStorefrontSection,
  AdminUpsertStorefrontColor,
} from "./validators"

export const adminStorefrontRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/storefront-pages",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: PolicyOperation.read,
        },
      ]),
      validateAndTransformQuery(
        AdminGetStorefrontPagesParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/storefront-pages",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.create],
        },
      ]),
      validateAndTransformBody(AdminCreateStorefrontPage),
      validateAndTransformQuery(
        AdminGetStorefrontPageParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/storefront-pages/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: PolicyOperation.read,
        },
      ]),
      validateAndTransformQuery(
        AdminGetStorefrontPageParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/storefront-pages/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminUpdateStorefrontPage),
      validateAndTransformQuery(
        AdminGetStorefrontPageParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/storefront-pages/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.delete],
        },
      ]),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/storefront-pages/:id/sections",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminCreateStorefrontSection),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/storefront-pages/:id/sections/reorder",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminReorderStorefrontSections),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/storefront-pages/:id/sections/:section_id",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminUpdateStorefrontSection),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/storefront-pages/:id/sections/:section_id",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/storefront-colors",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: PolicyOperation.read,
        },
      ]),
      validateAndTransformQuery(
        AdminGetStorefrontColorsParams,
        QueryConfig.listColorsTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/storefront-colors",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.update],
        },
      ]),
      validateAndTransformBody(AdminUpsertStorefrontColor),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/admin/storefront-colors/:id",
    middlewares: [
      authorize([
        {
          resource: Entities.storefront_page,
          operation: [PolicyOperation.read, PolicyOperation.delete],
        },
      ]),
    ],
  },
]
