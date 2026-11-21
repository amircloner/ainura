import type { MedusaContainer, ProductDTO } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils"

type StoreProductRequest = {
  scope: MedusaContainer
  publishable_key_context?: { sales_channel_ids: string[] }
  locale?: string
}

export async function listVisibleProducts(
  req: StoreProductRequest,
  filters: { id?: string | string[]; brand_id?: string[] },
  fields: string[]
): Promise<ProductDTO[]> {
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids
  if (!salesChannelIds?.length) {
    return []
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph(
    {
      entity: "product",
      fields,
      filters: {
        ...filters,
        status: ProductStatus.PUBLISHED,
        sales_channels: { id: salesChannelIds },
      },
    },
    { locale: req.locale }
  )
  return data
}

export async function requireVisibleProduct(
  req: StoreProductRequest,
  id: string,
  fields = ["id"]
) {
  const [product] = await listVisibleProducts(req, { id }, fields)
  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id: ${id} was not found`
    )
  }
  return product
}
