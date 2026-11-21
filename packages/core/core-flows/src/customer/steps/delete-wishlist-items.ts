import type { ICustomerModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const deleteWishlistItemsStepId = "delete-wishlist-items"

export const deleteWishlistItemsStep = createStep(
  deleteWishlistItemsStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)
    const existing = ids.length
      ? await service.listCustomerWishlistItems(
          { id: ids },
          { select: ["id"], take: null }
        )
      : []
    const deletedIds = existing.map(({ id }) => id)
    if (deletedIds.length) {
      await service.softDeleteCustomerWishlistItems(deletedIds)
    }
    return new StepResponse(void 0, deletedIds)
  },
  async (deletedIds, { container }) => {
    if (!deletedIds?.length) {
      return
    }
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)
    await service.restoreCustomerWishlistItems(deletedIds)
  }
)
