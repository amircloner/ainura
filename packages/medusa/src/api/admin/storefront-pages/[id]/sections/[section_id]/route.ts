import {
  deleteStorefrontSectionsWorkflow,
  updateStorefrontSectionsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, IStoreModuleService } from "@medusajs/framework/types"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import { AdminUpdateStorefrontSectionType } from "../../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateStorefrontSectionType>,
  res: MedusaResponse<HttpTypes.AdminStorefrontSectionResponse>
) => {
  const storeModule = req.scope.resolve<IStoreModuleService>(Modules.STORE)
  const [existing] = await storeModule.listStorefrontSections({
    id: req.params.section_id,
    page_id: req.params.id,
  })
  if (!existing) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront section with id: ${req.params.section_id} was not found`
    )
  }

  const { result } = await updateStorefrontSectionsWorkflow(req.scope).run({
    input: {
      sections: [{ id: req.params.section_id, ...req.validatedBody }],
    },
  })

  res.status(200).json({
    storefront_section: result[0] as unknown as HttpTypes.AdminStorefrontSection,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminStorefrontSectionDeleteResponse>
) => {
  await deleteStorefrontSectionsWorkflow(req.scope).run({
    input: { ids: [req.params.section_id] },
  })

  res.status(200).json({
    id: req.params.section_id,
    object: "storefront_section",
    deleted: true,
  })
}
