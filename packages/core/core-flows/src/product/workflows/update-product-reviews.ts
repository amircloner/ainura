import type { AdditionalData, ProductTypes } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { updateProductReviewsStep } from "../steps"

export type UpdateProductReviewsWorkflowInput = {
  reviews: ProductTypes.UpdateProductReviewDTO[]
} & AdditionalData

export const updateProductReviewsWorkflowId = "update-product-reviews"

export const updateProductReviewsWorkflow = createWorkflow(
  updateProductReviewsWorkflowId,
  (input: WorkflowData<UpdateProductReviewsWorkflowInput>) => {
    const reviews = updateProductReviewsStep(input.reviews)
    const reviewsUpdated = createHook("reviewsUpdated", {
      reviews,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(reviews, {
      hooks: [reviewsUpdated],
    })
  }
)
