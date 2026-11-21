import { createProductBrandsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminCreateBrandType } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminBrandListParams>,
  res: MedusaResponse<HttpTypes.AdminBrandListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: brands, metadata } = await query.graph({
    entity: "product_brand",
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  res.json({
    brands,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminCreateBrandType & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.AdminBrandResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { additional_data, ...rest } = req.validatedBody

  const { result } = await createProductBrandsWorkflow(req.scope).run({
    input: { brands: [rest], additional_data },
  })

  const { data: brands } = await query.graph({
    entity: "product_brand",
    filters: { id: result[0].id },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ brand: brands[0] })
}
