import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  MedusaError,
  Modules,
  OrderStatus,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const createProductReviewsStepId = "create-product-reviews"

export const createProductReviewsStep = createStep(
  createProductReviewsStepId,
  async (data: ProductTypes.CreateProductReviewDTO[], { container }) => {
    data.forEach(({ rating }) => validateProductReviewRating(rating))

    const productsByCustomer = new Map<string, Set<string>>()
    for (const { customer_id } of data) {
      if (customer_id && !productsByCustomer.has(customer_id)) {
        productsByCustomer.set(customer_id, new Set())
      }
    }
    if (productsByCustomer.size) {
      const query = container.resolve(ContainerRegistrationKeys.QUERY)
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["customer_id", "items.product_id", "items.quantity"],
        filters: {
          customer_id: [...productsByCustomer.keys()],
          is_draft_order: false,
          status: { $nin: [OrderStatus.CANCELED, OrderStatus.DRAFT] },
        },
      })

      for (const order of orders) {
        const products = productsByCustomer.get(order.customer_id)
        for (const item of order.items ?? []) {
          if (item.product_id && MathBN.gt(item.quantity, 0)) {
            products?.add(item.product_id)
          }
        }
      }
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const created = await service.createProductReviews(
      data.map((review) => ({
        ...review,
        verified_purchase: Boolean(
          review.customer_id &&
          productsByCustomer.get(review.customer_id)?.has(review.product_id)
        ),
      }))
    )
    return new StepResponse(
      created,
      created.map((r) => r.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.deleteProductReviews(createdIds)
  }
)

export function validateProductReviewRating(rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Review rating must be an integer between 1 and 5"
    )
  }
}
