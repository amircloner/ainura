import type { CatalogProduct } from "@/lib/medusa"

export type Category = NonNullable<CatalogProduct["category"]>

export const SORTS = [
  ["popular", "پربازدیدترین"],
  ["new", "جدیدترین"],
  ["bestsellers", "پرفروش‌ترین"],
  ["price-asc", "ارزان‌ترین"],
  ["price-desc", "گران‌ترین"],
  ["discount", "بیشترین تخفیف"],
] as const

export function normalizeText(value: string) {
  return value
    .toLocaleLowerCase("fa")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064b-\u065f\u0640]/g, "")
    .replace(/[\s\u200c]+/g, " ")
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .trim()
}

export function matchesText(
  query: string,
  ...values: (string | null | undefined)[]
) {
  const contents = normalizeText(values.filter(Boolean).join(" "))
  return normalizeText(query)
    .split(" ")
    .every((word) => contents.includes(word))
}

export function categoryTrail(category: CatalogProduct["category"]) {
  const trail: Category[] = []
  for (
    let current: Category | undefined = category;
    current && !trail.some((item) => item.handle === current?.handle);
    current = current.parent
  )
    trail.unshift(current)
  return trail
}

export function categoriesFrom(products: CatalogProduct[]) {
  return [
    ...new Map(
      products
        .flatMap((product) => categoryTrail(product.category))
        .map((category) => [category.handle, category])
    ).values(),
  ]
}

export function matchesProduct(product: CatalogProduct, query: string) {
  return matchesText(
    query,
    product.title,
    product.brand?.name,
    product.brand?.handle,
    product.handle,
    product.metadata?.product_code,
    ...categoryTrail(product.category).flatMap((category) => [
      category.name,
      category.handle,
    ])
  )
}

export function variantDiscount(variant: CatalogProduct["variants"][number]) {
  return variant.originalPrice != null && variant.originalPrice > variant.price
    ? Math.max(1, Math.round((1 - variant.price / variant.originalPrice) * 100))
    : 0
}

const catalogPrice = (amount: number, currency?: string) =>
  currency?.toLowerCase() === "irr" ? amount / 10 : amount

export function colorHex(color: string) {
  const normalized = normalizeText(color)
  return /^(#[a-f\d]{3}|#[a-f\d]{6})$/i.test(normalized)
    ? normalized
    : ((
        {
          مشکی: "#1a191a",
          سیاه: "#1a191a",
          black: "#1a191a",
          زرشکی: "#792840",
          burgundy: "#792840",
          عسلی: "#ad6d31",
          tan: "#ad6d31",
          "قهوه ای": "#805438",
          قهوه‌ای: "#805438",
          brown: "#805438",
          سفید: "#fff",
          white: "#fff",
          کرم: "#e7d9bc",
          بژ: "#c6ac91",
          beige: "#c6ac91",
          "سرمه ای": "#28364f",
          navy: "#28364f",
          آبی: "#5275a1",
          blue: "#5275a1",
          طوسی: "#88878a",
          خاکستری: "#88878a",
          gray: "#88878a",
          grey: "#88878a",
          صورتی: "#d89da6",
          pink: "#d89da6",
          سبز: "#647656",
          green: "#647656",
          زیتونی: "#6f704a",
          قرمز: "#be333a",
          red: "#be333a",
          "نقره ای": "#bcc0c3",
          طلایی: "#c4a04b",
        } as Record<string, string>
      )[normalized] ?? "#e6e1dc")
}

function amount(value: string | null) {
  const digits = normalizeText(value ?? "").replace(/[٬,\s]/g, "")
  if (!/^\d+$/.test(digits)) return undefined
  const parsed = Number(digits)
  return Number.isSafeInteger(parsed) ? parsed : undefined
}

export function catalogQuery(params: Pick<URLSearchParams, "get" | "getAll">) {
  const values = (key: string) => [
    ...new Set(
      params
        .getAll(key)
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ]
  const [first, last] = [amount(params.get("min")), amount(params.get("max"))]
  const reversed = first !== undefined && last !== undefined && first > last
  return {
    q: params.get("q")?.trim() ?? "",
    categories: values("category"),
    brands: values("brand"),
    sizes: values("size"),
    colors: values("color"),
    min: reversed ? last : first,
    max: reversed ? first : last,
    stock: params.get("stock") === "1",
    sale: params.get("sale") === "1",
    sort: SORTS.find(([id]) => id === params.get("sort"))?.[0] ?? "new",
  }
}

export function catalogResults(
  products: CatalogProduct[],
  filters: ReturnType<typeof catalogQuery>
) {
  const hasVariantFilters =
    filters.sizes.length ||
    filters.colors.length ||
    filters.min !== undefined ||
    filters.max !== undefined ||
    filters.stock ||
    filters.sale
  const sizes = filters.sizes.map(normalizeText)
  const colors = filters.colors.map(normalizeText)
  const results = products.flatMap((product) => {
    if (
      (filters.q && !matchesProduct(product, filters.q)) ||
      (filters.brands.length &&
        (!product.brand || !filters.brands.includes(product.brand.handle))) ||
      (filters.categories.length &&
        !categoryTrail(product.category).some((category) =>
          filters.categories.includes(category.handle)
        ))
    )
      return []
    const variants = product.variants.filter(
      (variant) =>
        (!sizes.length || sizes.includes(normalizeText(variant.size))) &&
        (!colors.length || colors.includes(normalizeText(variant.color))) &&
        (filters.min === undefined ||
          catalogPrice(variant.price, product.currency) >= filters.min) &&
        (filters.max === undefined ||
          catalogPrice(variant.price, product.currency) <= filters.max) &&
        (!filters.stock || variant.available) &&
        (!filters.sale || variantDiscount(variant) > 0)
    )
    if (hasVariantFilters && !variants.length) return []
    const available = variants.filter((variant) => variant.available)
    return [
      {
        product,
        variants,
        price: available.length
          ? Math.min(
              ...available.map((variant) =>
                catalogPrice(variant.price, product.currency)
              )
            )
          : undefined,
        discount: Math.max(0, ...available.map(variantDiscount)),
      },
    ]
  })

  // ponytail: Use merchandising flags until the catalog exposes actual traffic and sales aggregates.
  const newest = (product: CatalogProduct) =>
    Date.parse(product.created_at ?? "") || 0
  return results.sort((a, b) => {
    let difference = 0
    switch (filters.sort) {
      case "popular":
        difference =
          Number(Boolean(b.product.featured)) -
          Number(Boolean(a.product.featured))
        break
      case "bestsellers":
        difference =
          Number(Boolean(b.product.bestSeller)) -
          Number(Boolean(a.product.bestSeller))
        break
      case "discount":
        difference = b.discount - a.discount
        break
      case "price-asc":
        difference = (a.price ?? Infinity) - (b.price ?? Infinity)
        break
      case "price-desc":
        difference = (b.price ?? -Infinity) - (a.price ?? -Infinity)
        break
    }
    return (
      difference ||
      newest(b.product) - newest(a.product) ||
      a.product.handle.localeCompare(b.product.handle)
    )
  })
}
