import type {
  CreateCustomerWishlistItemDTO,
  ICustomerModuleService,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const createWishlistItemsStepId = "create-wishlist-items"

export const createWishlistItemsStep = createStep(
  createWishlistItemsStepId,
  async (data: CreateCustomerWishlistItemDTO[], { container }) => {
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)
    const created = await service.createCustomerWishlistItems(data)
    return new StepResponse(
      created,
      created.map((item) => item.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)
    await service.deleteCustomerWishlistItems(createdIds)
  }
)
