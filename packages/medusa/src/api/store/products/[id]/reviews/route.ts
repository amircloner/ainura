import { createProductReviewsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  MedusaStoreRequest,
  refetchEntity,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { requireVisibleProduct } from "../../../utils/visible-products"
import { StoreCreateProductReviewType } from "./validators"

export const GET = async (
  req: MedusaStoreRequest<unknown, HttpTypes.StoreProductReviewListParams>,
  res: MedusaResponse<HttpTypes.StoreProductReviewListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  await requireVisibleProduct(req, productId)

  const { data: reviews, metadata } = await query.graph({
    entity: "product_review",
    filters: {
      ...req.filterableFields,
      product_id: productId,
      status: "approved",
    },
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  const { data: allApproved } = await query.graph({
    entity: "product_review",
    filters: {
      product_id: productId,
      status: "approved",
    },
    fields: ["id", "rating", "is_recommended"],
  })

  const totalCount = allApproved.length
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
  let sum = 0
  let recommendedCount = 0

  for (const r of allApproved) {
    const rating = Math.min(
      5,
      Math.max(1, Math.round(Number(r.rating) || 5))
    ) as 1 | 2 | 3 | 4 | 5
    distribution[rating] += 1
    sum += rating
    if (r.is_recommended) {
      recommendedCount += 1
    }
  }

  res.json({
    reviews,
    stats: {
      product_id: productId,
      average_rating:
        totalCount > 0 ? Math.round((sum / totalCount) * 10) / 10 : 0,
      total_count: totalCount,
      recommendation_percentage:
        totalCount > 0 ? Math.round((recommendedCount / totalCount) * 100) : 0,
      distribution,
    },
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateProductReviewType>,
  res: MedusaResponse<HttpTypes.StoreProductReviewResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const customerId = req.auth_context.actor_id
  await requireVisibleProduct(req, productId)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    filters: { id: customerId },
    fields: ["id", "first_name", "last_name"],
  })
  if (!customer) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Customer not found")
  }

  const { customer_name, ...reviewData } = req.validatedBody
  const fullName = [customer.first_name, customer.last_name]
    .filter(Boolean)
    .join(" ")
  const { result } = await createProductReviewsWorkflow(req.scope).run({
    input: {
      reviews: [
        {
          ...reviewData,
          product_id: productId,
          customer_id: customerId,
          customer_name: customer_name || fullName || "Customer",
          status: "pending",
        },
      ],
    },
  })

  const review = await refetchEntity({
    entity: "product_review",
    idOrFilter: result[0].id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })
  res.json({ review })
}
