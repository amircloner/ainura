import { MedusaResponse, MedusaStoreRequest } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { queryStoreBrands } from "./helpers"

export const GET = async (
  req: MedusaStoreRequest<unknown, HttpTypes.StoreBrandListParams>,
  res: MedusaResponse<HttpTypes.StoreBrandListResponse>
) => {
  const { data: brands, metadata } = await queryStoreBrands(
    req,
    req.filterableFields
  )

  res.json({
    brands,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
