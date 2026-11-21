import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductReviewListParams>,
  res: MedusaResponse<HttpTypes.AdminProductReviewListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: reviews, metadata } = await query.graph({
    entity: "product_review",
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  res.json({
    reviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
