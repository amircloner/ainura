import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { deleteWishlistItemsStep } from "../steps"

export type DeleteWishlistItemsWorkflowInput = {
  ids: string[]
}

export const deleteWishlistItemsWorkflowId = "delete-wishlist-items"

export const deleteWishlistItemsWorkflow = createWorkflow(
  deleteWishlistItemsWorkflowId,
  (input: WorkflowData<DeleteWishlistItemsWorkflowInput>) => {
    const deleted = deleteWishlistItemsStep(input.ids)
    return new WorkflowResponse(deleted)
  }
)
