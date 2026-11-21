import type { CreateCustomerWishlistItemDTO } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createWishlistItemsStep } from "../steps"

export type CreateWishlistItemsWorkflowInput = {
  items: CreateCustomerWishlistItemDTO[]
}

export const createWishlistItemsWorkflowId = "create-wishlist-items"

export const createWishlistItemsWorkflow = createWorkflow(
  createWishlistItemsWorkflowId,
  (input: WorkflowData<CreateWishlistItemsWorkflowInput>) => {
    const items = createWishlistItemsStep(input.items)
    return new WorkflowResponse(items)
  }
)
