import Medusa from "@medusajs/js-sdk"
import type { HttpTypes, ProductFashionMetadata } from "@medusajs/types"
import { cache } from "react"
import { reviewStats } from "./format"
import {
  demoBrands,
  demoProducts,
  demoReviews,
  type CatalogCategory,
  type CatalogProduct,
  type CatalogReview,
  type ReviewStats,
} from "./seed-data"

export * from "./format"
export * from "./seed-data"

const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
export const connected = Boolean(backendUrl && publishableKey)
export const tokenKey = "ainura-customer-token"
export const sdk = new Medusa({
  baseUrl: backendUrl || "http://localhost:9000",
  publishableKey,
  auth: { type: "jwt", jwtTokenStorageKey: tokenKey },
})

export const getRegion = cache(async () => {
  const { regions } = await sdk.client.fetch<HttpTypes.StoreRegionListResponse>(
    "/store/regions",
    {
      signal: AbortSignal.timeout(4000),
    }
  )
  const preferred = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID
  const region = preferred
    ? regions.find(({ id }) => id === preferred)
    : (regions.find(({ currency_code }) => currency_code === "irr") ??
      regions[0])
  if (!region) throw new Error("منطقهٔ ارسال فروشگاه تنظیم نشده است.")
  return region
})

type Category = HttpTypes.StoreProductCategory
function categoryFrom(category?: Category | null, depth = 0): CatalogCategory {
  if (!category) return { handle: "all", name: "همه محصولات" }
  return {
    handle: category.handle,
    name: category.name,
    parent:
      category.parent_category && depth < 4
        ? categoryFrom(category.parent_category, depth + 1)
        : undefined,
  }
}

export const catalogFields =
  "+metadata,+categories.id,+categories.handle,+categories.name,+categories.parent_category_id,+variants.calculated_price,+variants.inventory_quantity,+variants.options.option_id"

export function toCatalogProduct(
  product: HttpTypes.StoreProduct,
  currency?: string
): CatalogProduct {
  const metadata: ProductFashionMetadata = product.metadata ?? {}
  const category =
    product.categories?.find((entry) => entry.parent_category_id) ??
    product.categories?.[0]
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description ?? "",
    category: categoryFrom(category),
    brand: product.brand ?? null,
    images: [
      ...new Set(
        [
          product.thumbnail,
          ...(product.images ?? []).map(({ url }) => url),
        ].filter((url): url is string => Boolean(url))
      ),
    ],
    variants: (product.variants ?? [])
      .filter((variant) => variant.calculated_price?.calculated_amount != null)
      .map((variant) => {
        const optionValue = (pattern: RegExp) =>
          variant.options?.find((value) =>
            pattern.test(
              value.option?.title ??
                product.options?.find((option) => option.id === value.option_id)
                  ?.title ??
                ""
            )
          )?.value
        const price = variant.calculated_price?.calculated_amount ?? 0
        return {
          id: variant.id,
          price,
          originalPrice: variant.calculated_price?.original_amount ?? price,
          color: optionValue(/color|colour|رنگ/i) ?? "",
          size: optionValue(/size|سایز|اندازه/i) ?? "",
          available:
            variant.manage_inventory === false ||
            variant.allow_backorder === true ||
            (variant.inventory_quantity ?? 0) > 0,
        }
      }),
    metadata,
    currency,
    created_at: product.created_at ?? "",
    featured: product.metadata?.featured === true,
    bestSeller: product.metadata?.best_seller === true,
  }
}

const loadCatalog = cache(async () => {
  const region = await getRegion()
  const page = async (offset: number) =>
    sdk.client.fetch<HttpTypes.StoreProductListResponse>("/store/products", {
      query: { region_id: region.id, fields: catalogFields, limit: 50, offset },
      signal: AbortSignal.timeout(4000),
    })
  const first = await page(0)
  const rest = await Promise.all(
    Array.from(
      { length: Math.max(0, Math.ceil(first.count / 50) - 1) },
      (_, i) => page((i + 1) * 50)
    )
  )
  const categories = await sdk.client
    .fetch<HttpTypes.StoreProductCategoryListResponse>(
      "/store/product-categories",
      {
        query: { limit: 100, fields: "id,handle,name,parent_category_id" },
        signal: AbortSignal.timeout(4000),
      }
    )
    .then(
      (result) => result.product_categories,
      () => []
    )
  const byId = new Map(categories.map((entry) => [entry.id, entry]))
  function withParents(category: Category, depth = 0): Category {
    const parent = byId.get(category.parent_category_id ?? "")
    return parent && depth < 4
      ? { ...category, parent_category: withParents(parent, depth + 1) }
      : category
  }
  return [first, ...rest].flatMap(({ products }) =>
    products.map((product) =>
      toCatalogProduct(
        {
          ...product,
          categories: product.categories?.map((entry) =>
            withParents(byId.get(entry.id) ?? entry)
          ),
        },
        region.currency_code
      )
    )
  )
})

export const getCatalog = cache(async (): Promise<CatalogProduct[]> => {
  if (!connected) return demoProducts
  try {
    return await loadCatalog()
  } catch {
    return demoProducts
  }
})

export const getProduct = cache(async (handle: string) =>
  (await getCatalog()).find((product) => product.handle === handle)
)

export const getBrands = cache(async () => {
  if (!connected) return demoBrands
  try {
    const { brands } = await sdk.client.fetch<HttpTypes.StoreBrandListResponse>(
      "/store/brands",
      {
        query: { limit: 100 },
        signal: AbortSignal.timeout(4000),
      }
    )
    return brands
  } catch {
    return demoBrands
  }
})

export async function getReviews(
  productId: string
): Promise<{ reviews: CatalogReview[]; stats: ReviewStats }> {
  if (!productId.startsWith("demo_")) {
    try {
      const { reviews, stats } =
        await sdk.client.fetch<HttpTypes.StoreProductReviewListResponse>(
          `/store/products/${productId}/reviews`,
          {
            signal: AbortSignal.timeout(4000),
          }
        )
      return { reviews, stats: stats ?? reviewStats(productId, reviews) }
    } catch {
      return { reviews: [], stats: reviewStats(productId, []) }
    }
  }
  const reviews = productId === demoProducts[0].id ? demoReviews : []
  return { reviews, stats: reviewStats(productId, reviews) }
}

export function submitReview(
  productId: string,
  input: HttpTypes.StoreCreateProductReview
) {
  if (productId.startsWith("demo_"))
    throw new Error("ثبت دیدگاه فقط برای محصولات فروشگاه فعال است.")
  return sdk.store.review.create(productId, input)
}
