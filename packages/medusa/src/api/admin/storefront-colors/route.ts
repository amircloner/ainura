import { upsertStorefrontColorsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { AdminUpsertStorefrontColorType } from "../storefront-pages/validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminStorefrontColorListParams>,
  res: MedusaResponse<HttpTypes.AdminStorefrontColorListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: colors, metadata } = await query.graph({
    entity: "storefront_color",
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
    fields: req.queryConfig.fields,
  })

  res.json({
    storefront_colors: colors,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpsertStorefrontColorType>,
  res: MedusaResponse<HttpTypes.AdminStorefrontColorResponse>
) => {
  const { result } = await upsertStorefrontColorsWorkflow(req.scope).run({
    input: { colors: [req.validatedBody] },
  })

  res.status(200).json({
    storefront_color: result[0] as unknown as HttpTypes.AdminStorefrontColor,
  })
}
