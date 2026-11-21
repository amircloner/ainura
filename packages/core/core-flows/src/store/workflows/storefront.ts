import type { StoreTypes } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  createStorefrontPagesStep,
  createStorefrontSectionsStep,
  deleteStorefrontColorsStep,
  deleteStorefrontPagesStep,
  deleteStorefrontSectionsStep,
  updateStorefrontPagesStep,
  updateStorefrontSectionsStep,
  upsertStorefrontColorsStep,
} from "../steps/storefront"

export const createStorefrontPagesWorkflowId = "create-storefront-pages"
export const createStorefrontPagesWorkflow = createWorkflow(
  createStorefrontPagesWorkflowId,
  (input: WorkflowData<{ pages: StoreTypes.CreateStorefrontPageDTO[] }>) => {
    const pages = createStorefrontPagesStep(input.pages)
    return new WorkflowResponse(pages)
  }
)

export const updateStorefrontPagesWorkflowId = "update-storefront-pages"
export const updateStorefrontPagesWorkflow = createWorkflow(
  updateStorefrontPagesWorkflowId,
  (
    input: WorkflowData<{
      pages: ({ id: string } & StoreTypes.UpdateStorefrontPageDTO)[]
    }>
  ) => {
    const pages = updateStorefrontPagesStep(input.pages)
    return new WorkflowResponse(pages)
  }
)

export const deleteStorefrontPagesWorkflowId = "delete-storefront-pages"
export const deleteStorefrontPagesWorkflow = createWorkflow(
  deleteStorefrontPagesWorkflowId,
  (input: WorkflowData<{ ids: string[] }>) => {
    deleteStorefrontPagesStep(input.ids)
    return new WorkflowResponse(void 0)
  }
)

export const createStorefrontSectionsWorkflowId = "create-storefront-sections"
export const createStorefrontSectionsWorkflow = createWorkflow(
  createStorefrontSectionsWorkflowId,
  (
    input: WorkflowData<{ sections: StoreTypes.CreateStorefrontSectionDTO[] }>
  ) => {
    const sections = createStorefrontSectionsStep(input.sections)
    return new WorkflowResponse(sections)
  }
)

export const updateStorefrontSectionsWorkflowId = "update-storefront-sections"
export const updateStorefrontSectionsWorkflow = createWorkflow(
  updateStorefrontSectionsWorkflowId,
  (
    input: WorkflowData<{
      sections: ({ id: string } & StoreTypes.UpdateStorefrontSectionDTO)[]
    }>
  ) => {
    const sections = updateStorefrontSectionsStep(input.sections)
    return new WorkflowResponse(sections)
  }
)

export const reorderStorefrontSectionsWorkflowId = "reorder-storefront-sections"
export const reorderStorefrontSectionsWorkflow = createWorkflow(
  reorderStorefrontSectionsWorkflowId,
  (input: WorkflowData<{ section_ids: string[] }>) => {
    const updates = transform({ input }, ({ input }) =>
      input.section_ids.map((id, rank) => ({ id, rank }))
    )
    const sections = updateStorefrontSectionsStep(updates)
    return new WorkflowResponse(sections)
  }
)

export const deleteStorefrontSectionsWorkflowId = "delete-storefront-sections"
export const deleteStorefrontSectionsWorkflow = createWorkflow(
  deleteStorefrontSectionsWorkflowId,
  (input: WorkflowData<{ ids: string[] }>) => {
    deleteStorefrontSectionsStep(input.ids)
    return new WorkflowResponse(void 0)
  }
)

export const upsertStorefrontColorsWorkflowId = "upsert-storefront-colors"
export const upsertStorefrontColorsWorkflow = createWorkflow(
  upsertStorefrontColorsWorkflowId,
  (
    input: WorkflowData<{
      colors: (StoreTypes.CreateStorefrontColorDTO & { id?: string })[]
    }>
  ) => {
    const colors = upsertStorefrontColorsStep(input.colors)
    return new WorkflowResponse(colors)
  }
)

export const deleteStorefrontColorsWorkflowId = "delete-storefront-colors"
export const deleteStorefrontColorsWorkflow = createWorkflow(
  deleteStorefrontColorsWorkflowId,
  (input: WorkflowData<{ ids: string[] }>) => {
    deleteStorefrontColorsStep(input.ids)
    return new WorkflowResponse(void 0)
  }
)
