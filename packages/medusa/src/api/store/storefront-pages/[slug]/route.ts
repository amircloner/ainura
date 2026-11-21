import { MedusaResponse } from "@medusajs/framework/http"
import { HttpTypes, StoreTypes } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import type { RequestWithContext } from "../../products/helpers"
import { hydrateStorefrontSections } from "../helpers"

export const GET = async (
  req: RequestWithContext<HttpTypes.StoreStorefrontPageParams>,
  res: MedusaResponse<HttpTypes.StoreStorefrontPageResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const slug = decodeURIComponent(req.params.slug).trim().toLowerCase()

  const { data: pages } = await query.graph(
    {
      entity: "storefront_page",
      filters: {
        slug,
        is_active: true,
      },
      fields: req.queryConfig.fields,
    },
    { locale: req.locale }
  )

  const page = pages[0] as StoreTypes.StorefrontPageDTO | undefined
  if (!page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront page with slug: ${slug} was not found`
    )
  }

  const sections = await hydrateStorefrontSections(req, page.sections ?? [])

  res.json({
    storefront_page: {
      id: page.id,
      slug: page.slug,
      title: page.title,
      subtitle: page.subtitle,
      page_type: page.page_type,
      metadata: page.metadata,
      sections,
    },
  })
}
