import {
  deleteProductReviewsWorkflow,
  updateProductReviewsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdminUpdateReviewType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.AdminProductReviewResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: reviews } = await query.graph({
    entity: "product_review",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  const review = reviews[0]
  if (!review) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Review with id "${req.params.id}" not found`
    )
  }

  res.status(200).json({ review })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminUpdateReviewType & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.AdminProductReviewResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existing } = await query.graph({
    entity: "product_review",
    filters: { id: req.params.id },
    fields: ["id"],
  })

  if (!existing.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Review with id "${req.params.id}" not found`
    )
  }

  const { additional_data, ...rest } = req.validatedBody

  await updateProductReviewsWorkflow(req.scope).run({
    input: {
      reviews: [{ id: req.params.id, ...rest }],
      additional_data,
    },
  })

  const { data: reviews } = await query.graph({
    entity: "product_review",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ review: reviews[0] })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductReviewDeleteResponse>
) => {
  const id = req.params.id

  await deleteProductReviewsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "review",
    deleted: true,
  })
}
