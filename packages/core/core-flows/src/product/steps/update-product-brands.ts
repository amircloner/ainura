import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const updateProductBrandsStepId = "update-product-brands"

export const updateProductBrandsStep = createStep(
  updateProductBrandsStepId,
  async (data: ProductTypes.UpdateProductBrandDTO[], { container }) => {
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const ids = data.map((b) => b.id).filter(Boolean) as string[]
    const prev = ids.length
      ? await service.listProductBrands({ id: ids })
      : []
    const updated = await service.updateProductBrands(data)
    return new StepResponse(updated, prev)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.updateProductBrands(
      prevData.map((b) => ({
        id: b.id,
        name: b.name,
        handle: b.handle,
        logo_url: b.logo_url,
        banner_url: b.banner_url,
        description: b.description,
        is_featured: b.is_featured,
        country: b.country,
        metadata: b.metadata,
      }))
    )
  }
)
