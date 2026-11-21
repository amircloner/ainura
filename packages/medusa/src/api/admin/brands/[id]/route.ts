import {
  deleteProductBrandsWorkflow,
  updateProductBrandsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { AdditionalData, HttpTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdminUpdateBrandType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.AdminBrandResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: brands } = await query.graph({
    entity: "product_brand",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  const brand = brands[0]
  if (!brand) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with id "${req.params.id}" not found`
    )
  }

  res.status(200).json({ brand })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminUpdateBrandType & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.AdminBrandResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: existing } = await query.graph({
    entity: "product_brand",
    filters: { id: req.params.id },
    fields: ["id"],
  })

  if (!existing.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Brand with id "${req.params.id}" not found`
    )
  }

  const { additional_data, ...rest } = req.validatedBody

  await updateProductBrandsWorkflow(req.scope).run({
    input: {
      brands: [{ id: req.params.id, ...rest }],
      additional_data,
    },
  })

  const { data: brands } = await query.graph({
    entity: "product_brand",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ brand: brands[0] })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminBrandDeleteResponse>
) => {
  const id = req.params.id

  await deleteProductBrandsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "brand",
    deleted: true,
  })
}
