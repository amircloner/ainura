import type {
  CreateProductWorkflowInputDTO,
  ExecArgs,
  MedusaContainer,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createPriceListPricesWorkflow,
  createPriceListsWorkflow,
  createProductBrandsWorkflow,
  createProductCategoriesWorkflow,
  createProductReviewsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows"
import type {
  CatalogCategory,
  CatalogReview,
  CatalogVariant,
} from "../apps/storefront/src/lib/seed-data.js" with {
  "resolution-mode": "import",
}

// Medusa exec loads this script as CommonJS; the storefront dataset is ESM.
const DATASET_PATH = "../apps/storefront/src/lib/seed-data.ts"

const CURRENCY = "irr"
const FIXTURE = "ainura-fashion"
const SALE_LIST = "Ainura fashion demo sale"
const LOCATION = "Ainura fashion demo stock"
const REVIEW_PRODUCT = "yelsan-clara-klr-601"
const DEMO_REVIEW_LABEL = "دیدگاه نمونه"
const skuFor = (variant: CatalogVariant) => `AINURA-${variant.id}`

function rial(toman: number) {
  const amount = toman * 10
  if (!Number.isSafeInteger(amount) || amount < 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid Toman price: ${toman}`
    )
  }
  return amount
}

async function ensureStoreSetup(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const store = container.resolve(Modules.STORE)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const regions = container.resolve(Modules.REGION)
  const locations = container.resolve(Modules.STOCK_LOCATION)
  const [defaultStore] = await store.listStores({}, { take: 1 })
  const channelId = defaultStore?.default_sales_channel_id
  if (!channelId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "The Medusa store needs a default sales channel before seeding fashion."
    )
  }

  const [existingRegion] = await regions.listRegions(
    { currency_code: CURRENCY },
    { take: 1 }
  )
  const region =
    existingRegion ??
    (
      await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: "Ainura demo Iran",
              currency_code: CURRENCY,
              countries: ["ir"],
              automatic_taxes: false,
            },
          ],
        },
      })
    ).result[0]

  const [existingProfile] = await fulfillment.listShippingProfiles(
    { type: "default" },
    { take: 1 }
  )
  const profile =
    existingProfile ??
    (
      await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: "Ainura fashion demo", type: "default" }] },
      })
    ).result[0]

  const [existingLocation] = await locations.listStockLocations(
    { name: LOCATION },
    { take: 1 }
  )
  const location =
    existingLocation ??
    (
      await createStockLocationsWorkflow(container).run({
        input: { locations: [{ name: LOCATION }] },
      })
    ).result[0]
  const { data: channelLinks } = await query.graph({
    entity: "sales_channel_location",
    fields: ["id"],
    filters: { stock_location_id: location.id, sales_channel_id: channelId },
  })
  if (!channelLinks.length) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: location.id, add: [channelId] },
    })
  }

  return {
    channelId,
    locationId: location.id,
    profileId: profile.id,
    regionId: region.id,
  }
}

async function seedReviews(
  container: MedusaContainer,
  productId: string,
  demoReviews: CatalogReview[]
) {
  const product = container.resolve(Modules.PRODUCT)
  const existing = new Set<unknown>()
  const take = 100
  for (let skip = 0; ; skip += take) {
    const [page, count] = await product.listAndCountProductReviews(
      { product_id: productId },
      { take, skip, order: { id: "ASC" } }
    )
    for (const review of page) {
      if (review.metadata?.fixture === FIXTURE) {
        existing.add(review.metadata.fixture_id)
      }
    }
    if (skip + take >= count) {
      break
    }
  }

  const reviews = demoReviews
    .filter(({ id }) => !existing.has(id))
    .map(
      ({
        id,
        customer_name,
        rating,
        title,
        content,
        pros,
        cons,
        is_recommended,
      }) => ({
        product_id: productId,
        customer_name: `${customer_name} (${DEMO_REVIEW_LABEL})`,
        title: title ? `${DEMO_REVIEW_LABEL}: ${title}` : DEMO_REVIEW_LABEL,
        content,
        rating,
        pros,
        cons,
        is_recommended,
        verified_purchase: false,
        status: "approved" as const,
        metadata: { fixture: FIXTURE, fixture_id: id },
      })
    )
  if (reviews.length) {
    await createProductReviewsWorkflow(container).run({ input: { reviews } })
  }
  return reviews.length
}

export default async function seedFashion({ container }: ExecArgs) {
  const includeReviews = process.env.AINURA_SEED_DEMO_REVIEWS === "1"
  if (includeReviews && process.env.NODE_ENV === "production") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Fictional reviews are only available in non-production demo environments."
    )
  }

  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const { demoBrands, demoCategories, demoProducts, demoReviews } =
    (await import(DATASET_PATH)) as typeof import(
      "../apps/storefront/src/lib/seed-data.js",
      {
        with: { "resolution-mode": "import" },
      }
    )
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const product = container.resolve(Modules.PRODUCT)
  const inventory = container.resolve(Modules.INVENTORY)
  const pricing = container.resolve(Modules.PRICING)
  const { channelId, locationId, profileId, regionId } =
    await ensureStoreSetup(container)

  const brands = await product.listProductBrands(
    { handle: demoBrands.map(({ handle }) => handle) },
    { take: demoBrands.length }
  )
  const brandIds = new Map(brands.map(({ handle, id }) => [handle, id]))
  const missingBrands = demoBrands
    .filter(({ handle }) => !brandIds.has(handle))
    .map(({ id, ...brand }) => ({
      ...brand,
      metadata: { fixture: FIXTURE, fixture_id: id },
    }))
  if (missingBrands.length) {
    const { result } = await createProductBrandsWorkflow(container).run({
      input: { brands: missingBrands },
    })
    for (const { handle, id } of result) {
      brandIds.set(handle, id)
    }
  }

  const categoryIds = new Map<string, string>()
  async function ensureCategory(category: CatalogCategory): Promise<string> {
    const cached = categoryIds.get(category.handle)
    if (cached) {
      return cached
    }
    const parentId = category.parent
      ? await ensureCategory(category.parent)
      : null
    const [existing] = await product.listProductCategories({
      handle: category.handle,
    })
    const entry =
      existing ??
      (
        await createProductCategoriesWorkflow(container).run({
          input: {
            product_categories: [
              {
                handle: category.handle,
                name: category.name,
                parent_category_id: parentId,
                is_active: true,
                is_internal: false,
              },
            ],
          },
        })
      ).result[0]
    categoryIds.set(category.handle, entry.id)
    return entry.id
  }
  for (const category of demoCategories) {
    await ensureCategory(category)
  }

  const existing = await product.listProducts(
    { handle: demoProducts.map(({ handle }) => handle) },
    { take: demoProducts.length }
  )
  const existingByHandle = new Map(
    existing.map((entry) => [entry.handle, entry])
  )
  const productsToCreate: CreateProductWorkflowInputDTO[] = []
  const productIds = new Map<string, string>()
  const variantsBySku = new Map<string, CatalogVariant>()
  for (const entry of demoProducts) {
    const current = existingByHandle.get(entry.handle)
    if (current && current.metadata?.fixture !== FIXTURE) {
      logger.warn(`Skipping existing non-fixture product: ${entry.handle}`)
      continue
    }
    for (const variant of entry.variants) {
      variantsBySku.set(skuFor(variant), variant)
    }
    if (current) {
      productIds.set(entry.handle, current.id)
      continue
    }
    const categoryId = await ensureCategory(entry.category)
    productsToCreate.push({
      handle: entry.handle,
      title: entry.title,
      description: entry.description,
      status: ProductStatus.PUBLISHED,
      brand_id: entry.brand ? brandIds.get(entry.brand.handle) : null,
      category_ids: [categoryId],
      thumbnail: entry.images[0],
      images: entry.images.map((url) => ({ url })),
      metadata: {
        ...entry.metadata,
        featured: entry.featured === true,
        best_seller: entry.bestSeller === true,
        fixture: FIXTURE,
        fixture_id: entry.id,
      },
      sales_channels: [{ id: channelId }],
      shipping_profile_id: profileId,
      options: [
        {
          title: "Color",
          values: [...new Set(entry.variants.map(({ color }) => color))],
        },
        {
          title: "Size",
          values: [...new Set(entry.variants.map(({ size }) => size))],
        },
      ],
      variants: entry.variants.map((variant) => ({
        title: `${variant.color} / ${variant.size}`,
        sku: skuFor(variant),
        options: { Color: variant.color, Size: variant.size },
        manage_inventory: true,
        allow_backorder: false,
        prices: [
          { currency_code: CURRENCY, amount: rial(variant.originalPrice) },
        ],
      })),
    })
  }
  if (productsToCreate.length) {
    const { result } = await createProductsWorkflow(container).run({
      input: { products: productsToCreate },
    })
    for (const { handle, id } of result) {
      productIds.set(handle, id)
    }
  }

  // ponytail: seed missing records only; use a separate migration for fixture updates.
  if (productIds.size) {
    const variants = await product.listProductVariants(
      { product_id: [...productIds.values()], sku: [...variantsBySku.keys()] },
      { take: variantsBySku.size }
    )
    const variantIds = variants.map(({ id }) => id)
    if (variantIds.length) {
      const { data: itemLinks } = await query.graph({
        entity: "product_variant_inventory_item",
        fields: ["variant_id", "inventory_item_id"],
        filters: { variant_id: variantIds },
      })
      const byVariantId = new Map(
        variants.flatMap(({ id, sku }) => {
          const fixture = sku ? variantsBySku.get(sku) : undefined
          return fixture ? [[id, fixture] as const] : []
        })
      )
      const levels = await inventory.listInventoryLevels(
        {
          location_id: locationId,
          inventory_item_id: itemLinks.map((link) => link.inventory_item_id),
        },
        { take: itemLinks.length }
      )
      const stocked = new Set(
        levels.map(({ inventory_item_id }) => inventory_item_id)
      )
      const missing = itemLinks
        .filter(({ inventory_item_id }) => !stocked.has(inventory_item_id))
        .map(({ variant_id, inventory_item_id }) => ({
          inventory_item_id,
          location_id: locationId,
          stocked_quantity: byVariantId.get(variant_id)?.available ? 12 : 0,
        }))
      if (missing.length) {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: missing },
        })
      }

      const discounts = [...byVariantId].flatMap(([id, fixture]) => {
        return fixture.price < fixture.originalPrice
          ? [
              {
                variant_id: id,
                currency_code: CURRENCY,
                amount: rial(fixture.price),
              },
            ]
          : []
      })
      if (discounts.length) {
        const lists = await pricing.listPriceLists({ q: SALE_LIST })
        const list = lists.find(
          ({ title, metadata }) =>
            title === SALE_LIST && metadata?.fixture === FIXTURE
        )
        if (!list) {
          await createPriceListsWorkflow(container).run({
            input: {
              price_lists_data: [
                {
                  title: SALE_LIST,
                  description:
                    "Sale prices from the Ainura fashion demo fixtures.",
                  status: "active",
                  metadata: { fixture: FIXTURE },
                  prices: discounts,
                },
              ],
            },
          })
        } else {
          const { data: priceLinks } = await query.graph({
            entity: "product_variant_price_set",
            fields: ["variant_id", "price_set_id"],
            filters: {
              variant_id: discounts.map(({ variant_id }) => variant_id),
            },
          })
          const prices = await pricing.listPrices(
            {
              price_list_id: [list.id],
              currency_code: CURRENCY,
              price_set_id: priceLinks.map(({ price_set_id }) => price_set_id),
            },
            { take: priceLinks.length, select: ["price_set_id"] }
          )
          const saleSets = new Set(
            prices.map(({ price_set_id }) => price_set_id)
          )
          const discountedVariants = new Set(
            priceLinks
              .filter(({ price_set_id }) => saleSets.has(price_set_id))
              .map(({ variant_id }) => variant_id)
          )
          const missingDiscounts = discounts.filter(
            ({ variant_id }) => !discountedVariants.has(variant_id)
          )
          if (missingDiscounts.length) {
            await createPriceListPricesWorkflow(container).run({
              input: { data: [{ id: list.id, prices: missingDiscounts }] },
            })
          }
        }
      }
    }
  }

  const reviewProductId = productIds.get(REVIEW_PRODUCT)
  const reviewCount =
    includeReviews && reviewProductId
      ? await seedReviews(container, reviewProductId, demoReviews)
      : 0
  logger.info(
    `Ainura fashion: ${productsToCreate.length} products created, ${productIds.size} fixture products present, ${reviewCount} demo reviews created. Region: ${regionId}; sales channel: ${channelId}.`
  )
}
