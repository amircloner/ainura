import { createStorefrontSectionsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, IStoreModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminCreateStorefrontSectionType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateStorefrontSectionType>,
  res: MedusaResponse<HttpTypes.AdminStorefrontSectionResponse>
) => {
  const storeModule = req.scope.resolve<IStoreModuleService>(Modules.STORE)
  const [page] = await storeModule.listStorefrontPages(
    { id: req.params.id },
    { relations: ["sections"] }
  )
  if (!page) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront page with id: ${req.params.id} was not found`
    )
  }

  const nextRank =
    req.validatedBody.rank ??
    (page.sections?.length
      ? Math.max(...page.sections.map((s) => s.rank)) + 1
      : 0)

  const { result } = await createStorefrontSectionsWorkflow(req.scope).run({
    input: {
      sections: [
        {
          page_id: req.params.id,
          ...req.validatedBody,
          rank: nextRank,
        },
      ],
    },
  })

  res.status(200).json({
    storefront_section: result[0] as unknown as HttpTypes.AdminStorefrontSection,
  })
}
