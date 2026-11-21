import { reorderStorefrontSectionsWorkflow } from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, IStoreModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminReorderStorefrontSectionsType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminReorderStorefrontSectionsType>,
  res: MedusaResponse<HttpTypes.AdminStorefrontPageResponse>
) => {
  const storeModule = req.scope.resolve<IStoreModuleService>(Modules.STORE)
  const sections = await storeModule.listStorefrontSections({
    page_id: req.params.id,
  })
  const validIds = new Set(sections.map((s) => s.id))
  const orderedIds = req.validatedBody.section_ids.filter((id) =>
    validIds.has(id)
  )
  if (!orderedIds.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No valid section IDs supplied for this page"
    )
  }

  await reorderStorefrontSectionsWorkflow(req.scope).run({
    input: { section_ids: orderedIds },
  })

  const page = await storeModule.retrieveStorefrontPage(req.params.id, {
    relations: ["sections"],
  })

  res.status(200).json({
    storefront_page: {
      ...(page as unknown as HttpTypes.AdminStorefrontPage),
      sections: [...((page.sections ?? []) as unknown as HttpTypes.AdminStorefrontSection[])].sort(
        (a, b) => a.rank - b.rank
      ),
    },
  })
}
