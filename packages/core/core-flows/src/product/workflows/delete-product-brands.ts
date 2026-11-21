import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { deleteProductBrandsStep } from "../steps"

export type DeleteProductBrandsWorkflowInput = {
  ids: string[]
}

export const deleteProductBrandsWorkflowId = "delete-product-brands"

export const deleteProductBrandsWorkflow = createWorkflow(
  deleteProductBrandsWorkflowId,
  (input: WorkflowData<DeleteProductBrandsWorkflowInput>) => {
    const deleted = deleteProductBrandsStep(input.ids)
    const brandsDeleted = createHook("brandsDeleted", {
      ids: input.ids,
    })

    return new WorkflowResponse(deleted, {
      hooks: [brandsDeleted],
    })
  }
)
