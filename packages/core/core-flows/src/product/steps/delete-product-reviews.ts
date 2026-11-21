import type { IProductModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const deleteProductReviewsStepId = "delete-product-reviews"

export const deleteProductReviewsStep = createStep(
  deleteProductReviewsStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.softDeleteProductReviews(ids)
    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.restoreProductReviews(prevIds)
  }
)
