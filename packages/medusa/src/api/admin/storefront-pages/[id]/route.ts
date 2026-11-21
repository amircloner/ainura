import {
  deleteStorefrontPagesWorkflow,
  updateStorefrontPagesWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { AdminUpdateStorefrontPageType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminStorefrontPageParams>,
  res: MedusaResponse<HttpTypes.AdminStorefrontPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: pages } = await query.graph({
    entity: "storefront_page",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  const page = pages[0] as HttpTypes.AdminStorefrontPage | undefined
  if (!page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront page with id: ${req.params.id} was not found`
    )
  }

  res.json({
    storefront_page: {
      ...page,
      sections: [...(page.sections ?? [])].sort((a, b) => a.rank - b.rank),
    },
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminUpdateStorefrontPageType,
    HttpTypes.AdminStorefrontPageParams
  >,
  res: MedusaResponse<HttpTypes.AdminStorefrontPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateStorefrontPagesWorkflow(req.scope).run({
    input: {
      pages: [{ id: req.params.id, ...req.validatedBody }],
    },
  })

  const { data: pages } = await query.graph({
    entity: "storefront_page",
    filters: { id: req.params.id },
    fields: req.queryConfig.fields,
  })

  const page = pages[0] as HttpTypes.AdminStorefrontPage | undefined
  if (!page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront page with id: ${req.params.id} was not found`
    )
  }

  res.json({
    storefront_page: {
      ...page,
      sections: [...(page.sections ?? [])].sort((a, b) => a.rank - b.rank),
    },
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminStorefrontPageDeleteResponse>
) => {
  await deleteStorefrontPagesWorkflow(req.scope).run({
    input: { ids: [req.params.id] },
  })

  res.status(200).json({
    id: req.params.id,
    object: "storefront_page",
    deleted: true,
  })
}
