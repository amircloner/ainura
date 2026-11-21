import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: MedusaRequest<HttpTypes.StoreStorefrontPageListParams>,
  res: MedusaResponse<HttpTypes.StoreStorefrontPageListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: pages, metadata } = await query.graph(
    {
      entity: "storefront_page",
      filters: {
        ...req.filterableFields,
        is_active: true,
      },
      pagination: req.queryConfig.pagination,
      fields: req.queryConfig.fields,
    },
    { locale: req.locale }
  )

  res.json({
    storefront_pages: pages as HttpTypes.StoreStorefrontPage[],
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
