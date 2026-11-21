import type {
  IStoreModuleService,
  StoreTypes,
} from "@medusajs/framework/types"
import { kebabCase, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

export const createStorefrontPagesStepId = "create-storefront-pages"
export const createStorefrontPagesStep = createStep(
  createStorefrontPagesStepId,
  async (data: StoreTypes.CreateStorefrontPageDTO[], { container }) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    const normalized = data.map((page) => ({
      ...page,
      slug: (page.slug || kebabCase(page.title)).trim().toLowerCase(),
    }))
    const created = await service.createStorefrontPages(normalized)
    return new StepResponse(
      created,
      created.map((p) => p.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.deleteStorefrontPages(createdIds)
  }
)

export const updateStorefrontPagesStepId = "update-storefront-pages"
export const updateStorefrontPagesStep = createStep(
  updateStorefrontPagesStepId,
  async (
    data: ({ id: string } & StoreTypes.UpdateStorefrontPageDTO)[],
    { container }
  ) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    const ids = data.map((p) => p.id)
    const prev = ids.length
      ? await service.listStorefrontPages({ id: ids })
      : []
    const normalized = data.map((page) => ({
      ...page,
      ...(page.slug ? { slug: page.slug.trim().toLowerCase() } : {}),
    }))
    const updated = await service.updateStorefrontPages(normalized)
    return new StepResponse(updated, prev)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.updateStorefrontPages(
      prevData.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        subtitle: p.subtitle,
        page_type: p.page_type,
        is_active: p.is_active,
        metadata: p.metadata,
      }))
    )
  }
)

export const deleteStorefrontPagesStepId = "delete-storefront-pages"
export const deleteStorefrontPagesStep = createStep(
  deleteStorefrontPagesStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.softDeleteStorefrontPages(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.restoreStorefrontPages(ids)
  }
)

export const createStorefrontSectionsStepId = "create-storefront-sections"
export const createStorefrontSectionsStep = createStep(
  createStorefrontSectionsStepId,
  async (data: StoreTypes.CreateStorefrontSectionDTO[], { container }) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    const created = await service.createStorefrontSections(data)
    return new StepResponse(
      created,
      created.map((s) => s.id)
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.deleteStorefrontSections(createdIds)
  }
)

export const updateStorefrontSectionsStepId = "update-storefront-sections"
export const updateStorefrontSectionsStep = createStep(
  updateStorefrontSectionsStepId,
  async (
    data: ({ id: string } & StoreTypes.UpdateStorefrontSectionDTO)[],
    { container }
  ) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    const ids = data.map((s) => s.id)
    const prev = ids.length
      ? await service.listStorefrontSections({ id: ids })
      : []
    const updated = await service.updateStorefrontSections(data)
    return new StepResponse(updated, prev)
  },
  async (prevData, { container }) => {
    if (!prevData?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.updateStorefrontSections(
      prevData.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        href: s.href,
        rank: s.rank,
        is_active: s.is_active,
        config: s.config,
        metadata: s.metadata,
      }))
    )
  }
)

export const deleteStorefrontSectionsStepId = "delete-storefront-sections"
export const deleteStorefrontSectionsStep = createStep(
  deleteStorefrontSectionsStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.softDeleteStorefrontSections(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.restoreStorefrontSections(ids)
  }
)

export const upsertStorefrontColorsStepId = "upsert-storefront-colors"
export const upsertStorefrontColorsStep = createStep(
  upsertStorefrontColorsStepId,
  async (
    data: (StoreTypes.CreateStorefrontColorDTO & { id?: string })[],
    { container }
  ) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    const existing = await service.listStorefrontColors(
      {},
      { take: 500 }
    )
    const byId = new Map(existing.map((c) => [c.id, c]))
    const byName = new Map(
      existing.map((c) => [c.name.trim().toLowerCase(), c])
    )

    const toCreate: StoreTypes.CreateStorefrontColorDTO[] = []
    const toUpdate: ({ id: string } & StoreTypes.UpdateStorefrontColorDTO)[] = []
    const prevUpdated: StoreTypes.StorefrontColorDTO[] = []

    for (const item of data) {
      const name = item.name.trim()
      const match =
        (item.id ? byId.get(item.id) : undefined) ??
        byName.get(name.toLowerCase())
      if (match) {
        prevUpdated.push(match)
        toUpdate.push({
          id: match.id,
          name,
          hex_code: item.hex_code.trim(),
          metadata: item.metadata,
        })
      } else {
        toCreate.push({
          name,
          hex_code: item.hex_code.trim(),
          metadata: item.metadata,
        })
      }
    }

    const created = toCreate.length
      ? await service.createStorefrontColors(toCreate)
      : []
    const updated = toUpdate.length
      ? await service.updateStorefrontColors(toUpdate)
      : []

    return new StepResponse([...created, ...updated], {
      createdIds: created.map((c) => c.id),
      prevUpdated,
    })
  },
  async (compensation, { container }) => {
    if (!compensation) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    if (compensation.createdIds.length) {
      await service.deleteStorefrontColors(compensation.createdIds)
    }
    if (compensation.prevUpdated.length) {
      await service.updateStorefrontColors(
        compensation.prevUpdated.map((c) => ({
          id: c.id,
          name: c.name,
          hex_code: c.hex_code,
          metadata: c.metadata,
        }))
      )
    }
  }
)

export const deleteStorefrontColorsStepId = "delete-storefront-colors"
export const deleteStorefrontColorsStep = createStep(
  deleteStorefrontColorsStepId,
  async (ids: string[], { container }) => {
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.softDeleteStorefrontColors(ids)
    return new StepResponse(void 0, ids)
  },
  async (ids, { container }) => {
    if (!ids?.length) return
    const service = container.resolve<IStoreModuleService>(Modules.STORE)
    await service.restoreStorefrontColors(ids)
  }
)
