import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { deleteProductReviewsStep } from "../steps"

export type DeleteProductReviewsWorkflowInput = {
  ids: string[]
}

export const deleteProductReviewsWorkflowId = "delete-product-reviews"

export const deleteProductReviewsWorkflow = createWorkflow(
  deleteProductReviewsWorkflowId,
  (input: WorkflowData<DeleteProductReviewsWorkflowInput>) => {
    const deleted = deleteProductReviewsStep(input.ids)
    const reviewsDeleted = createHook("reviewsDeleted", {
      ids: input.ids,
    })

    return new WorkflowResponse(deleted, {
      hooks: [reviewsDeleted],
    })
  }
)
