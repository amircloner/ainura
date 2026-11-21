import type {
  CreateProductWorkflowInputDTO,
  ExecArgs,
  MedusaContainer,
  StoreTypes,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  isValidHandle,
  MedusaError,
  Modules,
  ProductStatus,
  toHandle,
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
  createStorefrontPagesWorkflow,
  createStorefrontSectionsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateProductsWorkflow,
  upsertStorefrontColorsWorkflow,
} from "@medusajs/medusa/core-flows"
import type {
  CatalogCategory,
  CatalogVariant,
} from "../apps/storefront/src/lib/seed-data.js" with {
  "resolution-mode": "import",
}

const FIXTURE_PATH = "./fixtures/digistyle-fixture.ts"

const CURRENCY = "irr"
const FIXTURE = "digistyle-catalog"
const SALE_LIST = "Digistyle sale prices"
const LOCATION = "Digistyle main warehouse"
const FEATURED_DIGISTYLE_ID = 22797531

const EXTRA_LANDINGS: Array<{ slug: string; title: string; subtitle: string }> =
  [
    {
      slug: "autumn-trends",
      title: "ترندهای پاییزی",
      subtitle: "منتخب استایل‌های پاییزی دیجی‌استایل",
    },
    {
      slug: "turk-brands",
      title: "برندهای منتخب ترک",
      subtitle: "جدیدترین محصولات برندهای محبوب ترک",
    },
    {
      slug: "orginal-shoes",
      title: "کفش‌های اورجینال",
      subtitle: "کفش‌های روزمره، ورزشی و رسمی با ضمانت اصالت",
    },
    {
      slug: "leather-wear",
      title: "پوشاک و اکسسوری چرم",
      subtitle: "منتخب پوشاک، کیف و کفش چرم طبیعی",
    },
    {
      slug: "sweaters",
      title: "بافت و پلیور",
      subtitle: "جدیدترین مدل‌های بافت و پلیور فصل",
    },
    {
      slug: "trousers",
      title: "شلوار",
      subtitle: "انواع شلوار زنانه، مردانه و بچگانه",
    },
    {
      slug: "bag-category",
      title: "کیف زنانه و مردانه",
      subtitle: "انواع کیف دوشی، دستی، کوله‌پشتی و چمدان",
    },
    {
      slug: "watches-campaign",
      title: "ساعت مچی",
      subtitle: "ساعت‌های کلاسیک، اسپرت و هوشمند از برندهای معتبر",
    },
    {
      slug: "tshirt",
      title: "تیشرت",
      subtitle: "تیشرت‌های نخی و روزمره",
    },
    {
      slug: "boots",
      title: "بوت و نیم‌بوت",
      subtitle: "انواع بوت و نیم‌بوت پاییزی و زمستانی",
    },
    {
      slug: "accessories-aban",
      title: "اکسسوری‌های منتخب",
      subtitle: "عینک، ساعت، کیف پول و اکسسوری‌های روزمره",
    },
    {
      slug: "paydayaban-campaing",
      title: "پیشنهادهای ویژه دیجی‌استایل",
      subtitle: "تخفیف‌های منتخب فصل",
    },
    {
      slug: "gold-brands",
      title: "برندهای طلا و جواهر",
      subtitle: "زیورآلات طلا و نقره با ضمانت اصالت",
    },
    {
      slug: "vitamins-supplements-brands",
      title: "ویتامین و مکمل ورزشی",
      subtitle: "مکمل‌های غذایی و ورزشی اورجینال",
    },
    {
      slug: "camping-travel-brands",
      title: "لوازم کمپینگ و سفر",
      subtitle: "تجهیزات سفر، چمدان و کمپینگ",
    },
  ]

const FEATURED_REVIEWS = [
  {
    customer_name: "نگین رضایی",
    rating: 5,
    title: "دوخت تمیز و رنگ آجری بسیار شیک",
    content:
      "پارچه شمعی کیفیت خوبی دارد و آستر پلی‌استر باعث می‌شود تنخور خیلی مرتبی روی لباس داشته باشد. قد روی باسن دقیقاً مطابق عکس است.",
    pros: ["تنخور مرتب", "کیفیت دوخت خوب", "سبک و گرم"],
    cons: [],
    is_recommended: true,
    fixture_review_id: "ds_rev_1",
  },
  {
    customer_name: "مریم کاظمی",
    rating: 4,
    title: "مناسب پاییز و روزهای سرد",
    content:
      "بسته شدن ترکیبی زیپ و دکمه خیلی کاربردی است و جیب‌های مناسبی دارد. سایز M دقیقاً اندازه بود.",
    pros: ["بسته‌شدن دکمه و زیپ", "ارسال سریع دیجی‌استایل"],
    cons: [],
    is_recommended: true,
    fixture_review_id: "ds_rev_2",
  },
]

const skuFor = (variant: CatalogVariant) => `DS-${variant.id}`

function safeHandle(raw: string, fallback: string): string {
  const lowered = raw.trim().toLowerCase()
  if (isValidHandle(lowered)) return lowered
  const converted = toHandle(lowered)
  if (converted && isValidHandle(converted)) return converted
  return fallback
}

function rial(toman: number) {
  const amount = Math.round(toman * 10)
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
      "The Medusa store needs a default sales channel before seeding."
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
              name: "Iran (IRR)",
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
        input: { data: [{ name: "Default Shipping", type: "default" }] },
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

export default async function seedFashion({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const product = container.resolve(Modules.PRODUCT)
  const inventory = container.resolve(Modules.INVENTORY)
  const pricing = container.resolve(Modules.PRICING)
  const storeModule = container.resolve(Modules.STORE)

  const fixture = (await import(FIXTURE_PATH)) as typeof import("./fixtures/digistyle-fixture")

  const { channelId, locationId, profileId, regionId } =
    await ensureStoreSetup(container)

  // 1. Seed Colors (79 swatches)
  const colorEntries = Object.entries(fixture.DIGISTYLE_COLORS).map(
    ([name, hex_code]) => ({ name, hex_code })
  )
  await upsertStorefrontColorsWorkflow(container).run({
    input: { colors: colorEntries },
  })

  // 2. Seed Brands (60 brands)
  const brandHandles = fixture.DIGISTYLE_BRANDS.map(({ handle }) =>
    safeHandle(handle, `brand-${handle}`)
  )
  const existingBrands = await product.listProductBrands(
    { handle: brandHandles },
    { take: brandHandles.length + 20 }
  )
  const brandIds = new Map(existingBrands.map(({ handle, id }) => [handle, id]))
  const missingBrands = fixture.DIGISTYLE_BRANDS.filter(
    ({ handle }) => !brandIds.has(safeHandle(handle, `brand-${handle}`))
  )
  if (missingBrands.length) {
    const { result } = await createProductBrandsWorkflow(container).run({
      input: {
        brands: missingBrands.map((b) => ({
          name: b.name,
          handle: safeHandle(b.handle, `brand-${b.handle}`),
          logo_url: b.logo_url ?? null,
          banner_url: b.banner_url ?? null,
          description: b.description ?? null,
          is_featured: Boolean(b.is_featured),
          country: b.country || null,
          metadata: { fixture: FIXTURE },
        })),
      },
    })
    for (const { handle, id } of result) {
      brandIds.set(handle, id)
    }
  }

  // 3. Seed Categories (walk parent chains from all products)
  const allCategories = new Map<string, CatalogCategory>()
  const collectCat = (cat?: CatalogCategory) => {
    if (!cat) return
    if (cat.parent) collectCat(cat.parent)
    const h = safeHandle(cat.handle, "general")
    if (!allCategories.has(h)) allCategories.set(h, { ...cat, handle: h })
  }
  for (const p of fixture.DIGISTYLE_PRODUCTS) {
    collectCat(p.category)
  }

  const catHandles = [...allCategories.keys()]
  const existingCats = await product.listProductCategories(
    { handle: catHandles },
    { take: catHandles.length + 20 }
  )
  const categoryIds = new Map(
    existingCats.map(({ handle, id }) => [handle, id])
  )
  const depthOf = (cat: CatalogCategory): number =>
    cat.parent ? 1 + depthOf(cat.parent) : 0
  const sortedCats = [...allCategories.values()].sort(
    (a, b) => depthOf(a) - depthOf(b)
  )
  for (const cat of sortedCats) {
    if (categoryIds.has(cat.handle)) continue
    const parentHandle = cat.parent
      ? safeHandle(cat.parent.handle, "general")
      : undefined
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: [
          {
            name: cat.name,
            handle: cat.handle,
            is_active: true,
            is_internal: false,
            parent_category_id: parentHandle
              ? (categoryIds.get(parentHandle) ?? null)
              : null,
            metadata: { fixture: FIXTURE },
          },
        ],
      },
    })
    categoryIds.set(result[0].handle, result[0].id)
  }

  // 4. Seed Products (168 Digistyle products)
  const normalizedProducts = fixture.DIGISTYLE_PRODUCTS.map((entry) => ({
    ...entry,
    safeHandle: safeHandle(entry.handle, `product-${entry.digistyleId}`),
  }))

  const allHandles = normalizedProducts.map((p) => p.safeHandle)
  const existingProducts = await product.listProducts(
    { handle: allHandles },
    { take: allHandles.length + 20 }
  )
  const productIdByHandle = new Map(
    existingProducts.map(({ handle, id }) => [handle, id])
  )
  const productIdByDsId = new Map<number, string>()
  for (const p of normalizedProducts) {
    const existingId = productIdByHandle.get(p.safeHandle)
    if (existingId && p.digistyleId != null) {
      productIdByDsId.set(p.digistyleId, existingId)
    }
  }

  const variantsBySku = new Map<string, CatalogVariant>()
  const productsToCreate: CreateProductWorkflowInputDTO[] = []

  for (const entry of normalizedProducts) {
    // Deduplicate (color, size) pairs cleanly per product
    const uniqueVariants: CatalogVariant[] = []
    const seenPairs = new Set<string>()
    for (const v of entry.variants) {
      const pairKey = `${v.color}__${v.size}`
      if (seenPairs.has(pairKey)) continue
      seenPairs.add(pairKey)
      uniqueVariants.push(v)
      variantsBySku.set(skuFor(v), v)
    }

    if (productIdByHandle.has(entry.safeHandle)) continue

    const catHandle = safeHandle(entry.category.handle, "general")
    const categoryId = categoryIds.get(catHandle)
    const brandHandle = entry.brand
      ? safeHandle(entry.brand.handle, `brand-${entry.brand.handle}`)
      : undefined
    const brandId = brandHandle ? brandIds.get(brandHandle) : undefined
    const isFeatured227 = entry.digistyleId === FEATURED_DIGISTYLE_ID
    const hasDiscount = uniqueVariants.some(
      (v) => v.originalPrice > v.price && v.price > 0
    )

    productsToCreate.push({
      title: entry.title,
      handle: entry.safeHandle,
      description: entry.description,
      status: ProductStatus.PUBLISHED,
      discountable: true,
      brand_id: brandId ?? null,
      categories: categoryId ? [{ id: categoryId }] : [],
      thumbnail: entry.images[0],
      images: entry.images.map((url) => ({ url })),
      metadata: {
        ...entry.metadata,
        ...(isFeatured227
          ? {
              seller_stats: {
                stars: fixture.DIGISTYLE_FEATURED_PDP.seller.stars,
                ship_on_time: fixture.DIGISTYLE_FEATURED_PDP.seller.shipOnTime,
                no_return: fixture.DIGISTYLE_FEATURED_PDP.seller.noReturn,
                registration_date:
                  fixture.DIGISTYLE_FEATURED_PDP.seller.registrationDate,
              },
              promo_badge: fixture.DIGISTYLE_FEATURED_PDP.badgeTitle,
            }
          : hasDiscount
            ? { promo_badge: "حراج استایل" }
            : {}),
        featured: entry.featured === true,
        best_seller: entry.bestSeller === true,
        digistyle_id: entry.digistyleId,
        fixture: FIXTURE,
      },
      sales_channels: [{ id: channelId }],
      shipping_profile_id: profileId,
      options: [
        {
          title: "Color",
          values: [...new Set(uniqueVariants.map(({ color }) => color))],
        },
        {
          title: "Size",
          values: [...new Set(uniqueVariants.map(({ size }) => size))],
        },
      ],
      variants: uniqueVariants.map((variant) => ({
        title: `${variant.color} / ${variant.size}`,
        sku: skuFor(variant),
        options: { Color: variant.color, Size: variant.size },
        manage_inventory: true,
        allow_backorder: false,
        prices: [
          {
            currency_code: CURRENCY,
            amount: rial(Math.max(variant.originalPrice, variant.price, 0)),
          },
        ],
      })),
    })
  }

  // Create products in batches of 25
  for (let i = 0; i < productsToCreate.length; i += 25) {
    const batch = productsToCreate.slice(i, i + 25)
    const { result } = await createProductsWorkflow(container).run({
      input: { products: batch },
    })
    for (const created of result) {
      productIdByHandle.set(created.handle, created.id)
      const dsId = (created.metadata as any)?.digistyle_id
      if (typeof dsId === "number") {
        productIdByDsId.set(dsId, created.id)
      }
    }
  }

  // Attach recommended_product_ids on product 22797531 using real Medusa IDs
  const featuredMedusaId = productIdByDsId.get(FEATURED_DIGISTYLE_ID)
  if (featuredMedusaId) {
    const recMedusaIds = fixture.DIGISTYLE_FEATURED_PDP.recommendedIds
      .map((dsId) => productIdByDsId.get(dsId))
      .filter((id): id is string => Boolean(id))
    if (recMedusaIds.length) {
      const current = await product.retrieveProduct(featuredMedusaId)
      await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              id: featuredMedusaId,
              metadata: {
                ...(current.metadata ?? {}),
                recommended_product_ids: recMedusaIds,
              },
            },
          ],
        },
      })
    }
  }

  // 5. Seed Inventory Levels & Sale Price List
  const allProductIds = [...productIdByHandle.values()]
  if (allProductIds.length) {
    const variants = await product.listProductVariants(
      { product_id: allProductIds },
      { take: variantsBySku.size + 200 }
    )
    const byVariantId = new Map(
      variants.flatMap(({ id, sku }) => {
        const v = sku ? variantsBySku.get(sku) : undefined
        return v ? [[id, v] as const] : []
      })
    )
    const variantIds = [...byVariantId.keys()]
    if (variantIds.length) {
      const { data: itemLinks } = await query.graph({
        entity: "product_variant_inventory_item",
        fields: ["variant_id", "inventory_item_id"],
        filters: { variant_id: variantIds },
      })
      const existingLevels = await inventory.listInventoryLevels(
        {
          location_id: locationId,
          inventory_item_id: itemLinks.map((l: any) => l.inventory_item_id),
        },
        { take: itemLinks.length + 50 }
      )
      const stocked = new Set(existingLevels.map((l) => l.inventory_item_id))
      const missingLevels = itemLinks
        .filter((l: any) => !stocked.has(l.inventory_item_id))
        .map((l: any) => ({
          inventory_item_id: l.inventory_item_id,
          location_id: locationId,
          stocked_quantity: byVariantId.get(l.variant_id)?.available ? 15 : 0,
        }))
      if (missingLevels.length) {
        await createInventoryLevelsWorkflow(container).run({
          input: { inventory_levels: missingLevels },
        })
      }

      const discounts = [...byVariantId].flatMap(([id, v]) =>
        v.price > 0 && v.price < v.originalPrice
          ? [{ variant_id: id, currency_code: CURRENCY, amount: rial(v.price) }]
          : []
      )
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
                  description: "Discounted sale prices for Digistyle catalog",
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
            filters: { variant_id: discounts.map((d) => d.variant_id) },
          })
          const existingPrices = await pricing.listPrices(
            {
              price_list_id: [list.id],
              currency_code: CURRENCY,
              price_set_id: priceLinks.map((l: any) => l.price_set_id),
            },
            { take: priceLinks.length + 50, select: ["price_set_id"] }
          )
          const saleSets = new Set(existingPrices.map((p) => p.price_set_id))
          const discountedVariants = new Set(
            priceLinks
              .filter((l: any) => saleSets.has(l.price_set_id))
              .map((l: any) => l.variant_id)
          )
          const missingDiscounts = discounts.filter(
            (d) => !discountedVariants.has(d.variant_id)
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

  // 6. Seed Reviews for featured product 22797531
  if (featuredMedusaId) {
    const existingReviews = await product.listProductReviews(
      { product_id: featuredMedusaId },
      { take: 50 }
    )
    const seenReviews = new Set(
      existingReviews.map((r) => (r.metadata as any)?.fixture_review_id)
    )
    const missingReviews = FEATURED_REVIEWS.filter(
      (r) => !seenReviews.has(r.fixture_review_id)
    )
    if (missingReviews.length) {
      await createProductReviewsWorkflow(container).run({
        input: {
          reviews: missingReviews.map((r) => ({
            product_id: featuredMedusaId,
            customer_name: r.customer_name,
            rating: r.rating,
            title: r.title,
            content: r.content,
            pros: r.pros,
            cons: r.cons,
            is_recommended: r.is_recommended,
            status: "approved" as const,
            metadata: {
              fixture: FIXTURE,
              fixture_review_id: r.fixture_review_id,
            },
          })),
        },
      })
    }
  }

  // 7. Seed Storefront Pages & Sections (home, jackets, and all banner landings)
  const mapDsIds = (ids: number[]) =>
    ids
      .map((id) => productIdByDsId.get(id))
      .filter((id): id is string => Boolean(id))

  const ensurePageWithSections = async (
    pageInput: StoreTypes.CreateStorefrontPageDTO,
    sections: Omit<StoreTypes.CreateStorefrontSectionDTO, "page_id">[]
  ) => {
    const [existingPage] = await storeModule.listStorefrontPages(
      { slug: pageInput.slug },
      { relations: ["sections"], take: 1 }
    )
    const page =
      existingPage ??
      (
        await createStorefrontPagesWorkflow(container).run({
          input: { pages: [pageInput] },
        })
      ).result[0]

    if (!existingPage?.sections?.length && sections.length) {
      await createStorefrontSectionsWorkflow(container).run({
        input: {
          sections: sections.map((s, rank) => ({
            ...s,
            page_id: page.id,
            rank,
          })),
        },
      })
    }
  }

  const home = fixture.DIGISTYLE_HOME
  await ensurePageWithSections(
    {
      slug: "home",
      title: "فروشگاه اینترنتی مد و لباس دیجی‌استایل",
      subtitle: "جدیدترین مدل‌های لباس، کیف، کفش و اکسسوری",
      page_type: "home",
      is_active: true,
      metadata: { fixture: FIXTURE },
    },
    [
      {
        type: "hero_banner",
        title: "اسلایدر اصلی",
        is_active: true,
        config: {
          slides: home.heroSlides.map((s) => ({
            desktop_image: s.desktopImage,
            mobile_image: s.mobileImage,
            href: s.href,
            alt: s.alt,
          })),
        },
      },
      {
        type: "category_row",
        title: "دسته‌بندی‌ها",
        is_active: true,
        config: {
          items: home.categoryRow.map((c) => ({
            title: c.title,
            image: c.image,
            href: c.href,
          })),
        },
      },
      {
        type: "brand_marquee",
        title: home.brandRows[0].title,
        is_active: true,
        config: {
          reverse: false,
          brand_items: home.brandRows[0].items.map((b) => ({
            image: b.image,
            href: b.href,
          })),
        },
      },
      {
        type: "brand_marquee",
        title: null,
        is_active: true,
        config: {
          reverse: true,
          brand_items: home.brandRows[1].items.map((b) => ({
            image: b.image,
            href: b.href,
          })),
        },
      },
      {
        type: "amazing_carousel",
        title: home.amazingCarousel.title,
        href: home.amazingCarousel.href,
        is_active: true,
        config: {
          end_date_time: home.amazingCarousel.endDateTime,
          source: {
            mode: "hybrid",
            product_ids: mapDsIds(home.amazingCarousel.productIds),
            on_sale: true,
            sort: "discount",
            limit: 12,
          },
        },
      },
      {
        type: "tab_carousel",
        title: home.rainyTabCarousel.title,
        href: home.rainyTabCarousel.href,
        is_active: true,
        config: {
          tabs: home.rainyTabCarousel.tabs.map((tab) => ({
            title: tab.title,
            href: tab.href,
            source: {
              mode: "manual",
              product_ids: mapDsIds(tab.productIds),
              limit: 12,
            },
          })),
        },
      },
      {
        type: "two_banner",
        title: "بنرهای دوتایی",
        is_active: true,
        config: {
          banners: home.twoBanners.map((b) => ({
            desktop_image: b.desktopImage,
            mobile_image: b.mobileImage,
            href: b.href,
            alt: b.alt,
          })),
        },
      },
      {
        type: "four_banner",
        title: "بنرهای چهارتایی",
        is_active: true,
        config: {
          banners: home.fourBanners.map((b) => ({
            desktop_image: b.desktopImage,
            mobile_image: b.mobileImage,
            href: b.href,
            alt: b.alt,
          })),
        },
      },
      {
        type: "simple_carousel",
        title: home.supplementsCarousel.title,
        href: home.supplementsCarousel.href,
        is_active: true,
        config: {
          source: {
            mode: "hybrid",
            product_ids: mapDsIds(home.supplementsCarousel.productIds),
            category_id: categoryIds.get("personal-appliance") ?? null,
            limit: 12,
          },
        },
      },
      {
        type: "tab_carousel",
        title: home.popularBrandsTabCarousel.title,
        href: home.popularBrandsTabCarousel.href,
        is_active: true,
        config: {
          tabs: home.popularBrandsTabCarousel.tabs.map((tab) => ({
            title: tab.title,
            href: tab.href,
            source: {
              mode: "manual",
              product_ids: mapDsIds(tab.productIds),
              limit: 12,
            },
          })),
        },
      },
      {
        type: "simple_carousel",
        title: home.cosmeticsCarousel.title,
        href: home.cosmeticsCarousel.href,
        is_active: true,
        config: {
          source: {
            mode: "hybrid",
            product_ids: mapDsIds(home.cosmeticsCarousel.productIds),
            category_id: categoryIds.get("personal-appliance") ?? null,
            limit: 12,
          },
        },
      },
      {
        type: "trust_badges",
        title: "مزایای خرید از دیجی‌استایل",
        is_active: true,
        config: {
          items: home.trustRow.map((t) => ({
            title: t.title,
            image: t.image,
          })),
        },
      },
    ]
  )

  // Jackets Landing Page
  await ensurePageWithSections(
    {
      slug: "jackets",
      title: fixture.DIGISTYLE_JACKETS_LANDING.title,
      subtitle: fixture.DIGISTYLE_JACKETS_LANDING.subtitle,
      page_type: "landing",
      is_active: true,
      metadata: { fixture: FIXTURE },
    },
    [
      ...fixture.DIGISTYLE_JACKETS_LANDING.sections.map((section) => {
        const catSlug = section.href.replace(/^\/categories\//, "")
        return {
          type: "simple_carousel" as const,
          title: section.title,
          href: section.href,
          is_active: true,
          config: {
            source: {
              mode: "hybrid" as const,
              product_ids: mapDsIds(section.productIds),
              category_id: categoryIds.get(catSlug) ?? null,
              limit: 12,
            },
          },
        }
      }),
      {
        type: "trust_badges",
        title: "مزایای خرید از دیجی‌استایل",
        is_active: true,
        config: {
          items: home.trustRow.map((t) => ({
            title: t.title,
            image: t.image,
          })),
        },
      },
    ]
  )

  // Additional Banner Landing Pages
  for (const landing of EXTRA_LANDINGS) {
    await ensurePageWithSections(
      {
        slug: landing.slug,
        title: landing.title,
        subtitle: landing.subtitle,
        page_type: "landing",
        is_active: true,
        metadata: { fixture: FIXTURE },
      },
      [
        {
          type: "simple_carousel",
          title: `منتخب ${landing.title}`,
          href: "/products",
          is_active: true,
          config: {
            source: {
              mode: "filter",
              sort: "discount",
              limit: 12,
            },
          },
        },
        {
          type: "trust_badges",
          title: "مزایای خرید از دیجی‌استایل",
          is_active: true,
          config: {
            items: home.trustRow.map((t) => ({
              title: t.title,
              image: t.image,
            })),
          },
        },
      ]
    )
  }

  logger.info(
    `Digistyle dynamic seed complete: ${brandIds.size} brands, ${categoryIds.size} categories, ${productIdByHandle.size} products, ${colorEntries.length} colors, ${EXTRA_LANDINGS.length + 2} storefront pages. Region: ${regionId}; sales channel: ${channelId}.`
  )
}
