import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { validateProductReviewRating } from "./create-product-reviews"

export const updateProductReviewsStepId = "update-product-reviews"

export const updateProductReviewsStep = createStep(
  updateProductReviewsStepId,
  async (data: ProductTypes.UpdateProductReviewDTO[], { container }) => {
    for (const { rating } of data) {
      if (rating !== undefined) {
        validateProductReviewRating(rating)
      }
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const ids = data.map((r) => r.id).filter(Boolean) as string[]
    const prev = ids.length
      ? await service.listProductReviews({ id: ids })
      : []
    const updated = await service.updateProductReviews(data)
    return new StepResponse(updated, prev)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.updateProductReviews(
      prevData.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        pros: r.pros,
        cons: r.cons,
        is_recommended: r.is_recommended,
        verified_purchase: r.verified_purchase,
        status: r.status,
        metadata: r.metadata,
      }))
    )
  }
)
