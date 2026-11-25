import type { CatalogProduct, CatalogTag } from "@/lib/medusa"

export type Category = NonNullable<CatalogProduct["category"]>
export type Tag = CatalogTag

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

export function productCategories(product: CatalogProduct): Category[] {
  const assigned = product.categories?.length
    ? product.categories
    : [product.category]
  return [
    ...new Map(
      assigned
        .flatMap((category) => categoryTrail(category))
        .map((category) => [category.handle, category])
    ).values(),
  ]
}

export function categoriesFrom(products: CatalogProduct[]) {
  return [
    ...new Map(
      products
        .flatMap((product) => productCategories(product))
        .map((category) => [category.handle, category])
    ).values(),
  ]
}

export function tagsFrom(products: CatalogProduct[]): Tag[] {
  return [
    ...new Map(
      products
        .flatMap((product) => product.tags ?? [])
        .map((tag) => [tag.handle, tag])
    ).values(),
  ].sort((a, b) => a.value.localeCompare(b.value, "fa"))
}

export function matchesProduct(product: CatalogProduct, query: string) {
  return matchesText(
    query,
    product.title,
    product.brand?.name,
    product.brand?.handle,
    product.handle,
    product.metadata?.product_code,
    ...productCategories(product).flatMap((category) => [
      category.name,
      category.handle,
    ]),
    ...(product.tags ?? []).flatMap((tag) => [tag.value, tag.handle])
  )
}

export function variantDiscount(variant: CatalogProduct["variants"][number]) {
  return variant.originalPrice != null && variant.originalPrice > variant.price
    ? Math.max(1, Math.round((1 - variant.price / variant.originalPrice) * 100))
    : 0
}

const catalogPrice = (amount: number, currency?: string) =>
  currency?.toLowerCase() === "irr" ? amount / 10 : amount

export function colorHex(color: string, colorMap?: Record<string, string>) {
  const normalized = normalizeText(color)
  if (/^(#[a-f\d]{3}|#[a-f\d]{6})$/i.test(normalized)) return normalized
  if (colorMap) {
    if (colorMap[color]) return colorMap[color]
    for (const [name, hex] of Object.entries(colorMap)) {
      if (normalizeText(name) === normalized) return hex
    }
  }
  return "#e6e1dc"
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
    tags: values("tag"),
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
        !productCategories(product).some((category) =>
          filters.categories.includes(category.handle)
        )) ||
      (filters.tags.length &&
        !(product.tags ?? []).some(
          (tag) =>
            filters.tags.includes(tag.handle) ||
            filters.tags.includes(tag.value)
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
