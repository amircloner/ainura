import type {
  HttpTypes,
  QueryContextType,
  StoreTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  isPresent,
  ProductStatus,
  QueryContext,
} from "@medusajs/framework/utils"
import {
  prepareInventoryQuantityFields,
  wrapVariantsWithInventoryQuantityForSalesChannel,
} from "../../utils/middlewares"
import { RequestWithContext, wrapProductsWithTaxPrices } from "../products/helpers"

const SECTION_PRODUCT_FIELDS = [
  "id",
  "title",
  "subtitle",
  "description",
  "handle",
  "thumbnail",
  "collection_id",
  "brand_id",
  "created_at",
  "metadata",
  "*brand",
  "*images",
  "*options",
  "*options.values",
  "*categories",
  "*variants",
  "*variants.options",
  "variants.calculated_price.*",
  "variants.inventory_quantity",
  "variants.manage_inventory",
  "variants.allow_backorder",
]

function productPriceStats(product: HttpTypes.StoreProduct) {
  let minPrice = Infinity
  let maxDiscount = 0
  for (const variant of product.variants ?? []) {
    const calc = variant.calculated_price
    const amount = calc?.calculated_amount
    if (amount == null) continue
    if (amount < minPrice) minPrice = amount
    const orig = calc?.original_amount ?? amount
    if (orig > amount) {
      const pct = Math.round((1 - amount / orig) * 100)
      if (pct > maxDiscount) maxDiscount = pct
    }
  }
  return { minPrice, maxDiscount }
}

async function fetchVisibleProductsForRequest(
  req: RequestWithContext,
  extraFilters: Record<string, unknown>,
  take: number
): Promise<HttpTypes.StoreProduct[]> {
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids
  if (!salesChannelIds?.length) {
    return []
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { fields, withInventoryQuantity } = prepareInventoryQuantityFields(
    [...SECTION_PRODUCT_FIELDS],
    { relation: "variants" }
  )

  const context: QueryContextType = {}
  if (isPresent(req.pricingContext)) {
    context["variants"] = {
      calculated_price: QueryContext(req.pricingContext!),
    }
  }

  const { data: products = [] } = await query.graph(
    {
      entity: "product",
      fields,
      filters: {
        ...extraFilters,
        status: ProductStatus.PUBLISHED,
        sales_channels: { id: salesChannelIds },
      },
      pagination: { skip: 0, take },
      context,
    },
    { locale: req.locale }
  )

  if (withInventoryQuantity && products.length) {
    await wrapVariantsWithInventoryQuantityForSalesChannel(
      req,
      products.flatMap((p: any) => p.variants ?? [])
    )
  }

  if (products.length) {
    await wrapProductsWithTaxPrices(req, products)
  }

  return products as HttpTypes.StoreProduct[]
}

async function resolveProductSource(
  req: RequestWithContext,
  source?: StoreTypes.StorefrontProductSource
): Promise<HttpTypes.StoreProduct[]> {
  if (!source) return []
  const limit = Math.min(Math.max(source.limit ?? 12, 1), 48)
  const mode = source.mode ?? "hybrid"
  const manualIds = (source.product_ids ?? []).filter(Boolean)

  const ordered: HttpTypes.StoreProduct[] = []
  const seen = new Set<string>()

  if ((mode === "manual" || mode === "hybrid") && manualIds.length) {
    const manualProducts = await fetchVisibleProductsForRequest(
      req,
      { id: manualIds },
      manualIds.length
    )
    const byId = new Map(manualProducts.map((p) => [p.id, p]))
    for (const id of manualIds) {
      const product = byId.get(id)
      if (product && !seen.has(product.id)) {
        seen.add(product.id)
        ordered.push(product)
      }
    }
  }

  const needsFilter =
    mode === "filter" || (mode === "hybrid" && ordered.length < limit)

  if (needsFilter) {
    const filters: Record<string, unknown> = {}
    if (source.category_id) {
      filters.categories = { id: source.category_id }
    }
    if (source.brand_id) {
      filters.brand_id = source.brand_id
    }
    if (source.collection_id) {
      filters.collection_id = source.collection_id
    }

    const fetchTake = source.on_sale || source.sort ? Math.max(limit * 3, 48) : limit
    let candidates = await fetchVisibleProductsForRequest(req, filters, fetchTake)

    if (source.on_sale) {
      candidates = candidates.filter((p) => productPriceStats(p).maxDiscount > 0)
    }

    if (source.sort === "discount") {
      candidates.sort(
        (a, b) => productPriceStats(b).maxDiscount - productPriceStats(a).maxDiscount
      )
    } else if (source.sort === "price_asc") {
      candidates.sort(
        (a, b) => productPriceStats(a).minPrice - productPriceStats(b).minPrice
      )
    } else if (source.sort === "price_desc") {
      candidates.sort(
        (a, b) => productPriceStats(b).minPrice - productPriceStats(a).minPrice
      )
    } else {
      candidates.sort(
        (a, b) =>
          (Date.parse(b.created_at ?? "") || 0) -
          (Date.parse(a.created_at ?? "") || 0)
      )
    }

    for (const product of candidates) {
      if (ordered.length >= limit) break
      if (!seen.has(product.id)) {
        seen.add(product.id)
        ordered.push(product)
      }
    }
  }

  return ordered.slice(0, limit)
}

export async function hydrateStorefrontSections(
  req: RequestWithContext,
  sections: StoreTypes.StorefrontSectionDTO[]
): Promise<HttpTypes.StoreStorefrontSection[]> {
  const activeOrdered = sections
    .filter((s) => s.is_active !== false)
    .sort((a, b) => a.rank - b.rank)

  return Promise.all(
    activeOrdered.map(async (section) => {
      const base: HttpTypes.StoreStorefrontSection = {
        id: section.id,
        page_id: section.page_id,
        type: section.type,
        title: section.title,
        href: section.href,
        rank: section.rank,
        config: section.config ?? {},
        metadata: section.metadata,
      }

      if (
        section.type === "amazing_carousel" ||
        section.type === "simple_carousel"
      ) {
        base.products = await resolveProductSource(req, section.config?.source)
      } else if (section.type === "tab_carousel") {
        const rawTabs = section.config?.tabs ?? []
        base.tabs = await Promise.all(
          rawTabs.map(async (tab) => ({
            title: tab.title,
            href: tab.href,
            products: await resolveProductSource(req, tab.source),
          }))
        )
      }

      return base
    })
  )
}
