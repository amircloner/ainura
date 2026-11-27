import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reviews, metadata } = await query.graph({
    entity: "product_review",
    fields: req.queryConfig.fields,
    filters: { customer_id: req.auth_context.actor_id },
    pagination: req.queryConfig.pagination,
  })

  res.json({
    reviews,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
