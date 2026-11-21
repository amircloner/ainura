import type {
  IProductModuleService,
  ProductTypes,
} from "@medusajs/framework/types"
import { kebabCase, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const createProductBrandsStepId = "create-product-brands"

export const createProductBrandsStep = createStep(
  createProductBrandsStepId,
  async (data: ProductTypes.CreateProductBrandDTO[], { container }) => {
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    const normalized = data.map((brand) => ({
      ...brand,
      handle: brand.handle || kebabCase(brand.name),
    }))
    const created = await service.createProductBrands(normalized)
    return new StepResponse(
      created,
      created.map((b) => b.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) {
      return
    }
    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)
    await service.deleteProductBrands(createdIds)
  }
)
