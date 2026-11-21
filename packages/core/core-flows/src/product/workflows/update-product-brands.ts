import type { AdditionalData, ProductTypes } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { updateProductBrandsStep } from "../steps"

export type UpdateProductBrandsWorkflowInput = {
  brands: ProductTypes.UpdateProductBrandDTO[]
} & AdditionalData

export const updateProductBrandsWorkflowId = "update-product-brands"

export const updateProductBrandsWorkflow = createWorkflow(
  updateProductBrandsWorkflowId,
  (input: WorkflowData<UpdateProductBrandsWorkflowInput>) => {
    const brands = updateProductBrandsStep(input.brands)
    const brandsUpdated = createHook("brandsUpdated", {
      brands,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(brands, {
      hooks: [brandsUpdated],
    })
  }
)
