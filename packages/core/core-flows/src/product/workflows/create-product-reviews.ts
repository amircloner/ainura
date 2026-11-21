import type { AdditionalData, ProductTypes } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createProductReviewsStep } from "../steps"

export type CreateProductReviewsWorkflowInput = {
  reviews: ProductTypes.CreateProductReviewDTO[]
} & AdditionalData

export const createProductReviewsWorkflowId = "create-product-reviews"

/**
 * Create product reviews with integer ratings from 1 to 5. Purchase verification
 * is derived from the customer's non-draft, non-canceled orders, not the input flag.
 *
 * @summary Create product reviews.
 * @property hooks.reviewsCreated - Runs after the reviews are created.
 * @example
 * const { result } = await createProductReviewsWorkflow(container).run({
 *   input: { reviews: [{ product_id: "prod_123", customer_id: "cus_123", customer_name: "Jane", rating: 5, content: "Great fit" }] },
 * })
 */
export const createProductReviewsWorkflow = createWorkflow(
  createProductReviewsWorkflowId,
  (input: WorkflowData<CreateProductReviewsWorkflowInput>) => {
    const reviews = createProductReviewsStep(input.reviews)
    const reviewsCreated = createHook("reviewsCreated", {
      reviews,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(reviews, {
      hooks: [reviewsCreated],
    })
  }
)
