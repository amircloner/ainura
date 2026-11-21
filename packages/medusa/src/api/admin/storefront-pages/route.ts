import { createStorefrontPagesWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminCreateStorefrontPageType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminStorefrontPageListParams>,
  res: MedusaResponse<HttpTypes.AdminStorefrontPageListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: pages, metadata } = await query.graph({
    entity: "storefront_page",
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  const sorted = (pages as HttpTypes.AdminStorefrontPage[]).map((page) => ({
    ...page,
    sections: [...(page.sections ?? [])].sort((a, b) => a.rank - b.rank),
  }))

  res.json({
    storefront_pages: sorted,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminCreateStorefrontPageType,
    HttpTypes.AdminStorefrontPageParams
  >,
  res: MedusaResponse<HttpTypes.AdminStorefrontPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { result } = await createStorefrontPagesWorkflow(req.scope).run({
    input: { pages: [req.validatedBody] },
  })

  const { data: pages } = await query.graph({
    entity: "storefront_page",
    filters: { id: result[0].id },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ storefront_page: pages[0] })
}
