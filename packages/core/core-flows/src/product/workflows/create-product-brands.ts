import type { AdditionalData, ProductTypes } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { createProductBrandsStep } from "../steps"

export type CreateProductBrandsWorkflowInput = {
  brands: ProductTypes.CreateProductBrandDTO[]
} & AdditionalData

export const createProductBrandsWorkflowId = "create-product-brands"

export const createProductBrandsWorkflow = createWorkflow(
  createProductBrandsWorkflowId,
  (input: WorkflowData<CreateProductBrandsWorkflowInput>) => {
    const brands = createProductBrandsStep(input.brands)
    const brandsCreated = createHook("brandsCreated", {
      brands,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(brands, {
      hooks: [brandsCreated],
    })
  }
)
