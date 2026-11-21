"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { useCommerce } from "@/lib/commerce"
import type { CatalogProduct } from "@/lib/medusa"
import { Icon, Modal, number, price } from "../layout/ui"
import {
  catalogQuery,
  catalogResults,
  categoriesFrom,
  colorHex,
  matchesText,
  normalizeText,
  SORTS,
  type Category,
} from "./catalog"
import { ProductCard } from "./product-card"

const SIZES = [
  ...Array.from({ length: 9 }, (_, index) => `${index + 36}`),
  "S",
  "M",
  "L",
  "XL",
  "XXL",
]
const FACETS = [
  "q",
  "category",
  "brand",
  "size",
  "color",
  "min",
  "max",
  "stock",
  "sale",
]
const sizeLabel = (size: string) =>
  /^\d+$/.test(size) ? number(Number(size)) : size

function CategoryTree({
  categories,
  selected,
  toggle,
  parent,
}: {
  categories: Category[]
  selected: string[]
  toggle: (value: string) => void
  parent?: string
}) {
  return (
    <ul className="store-category-tree">
      {categories
        .filter((category) => category.parent?.handle === parent)
        .map((category) => (
          <li key={category.handle}>
            <label>
              <input
                type="checkbox"
                checked={selected.includes(category.handle)}
                onChange={() => toggle(category.handle)}
              />
              {category.name}
            </label>
            {categories.some(
              (child) => child.parent?.handle === category.handle
            ) && (
              <CategoryTree
                categories={categories}
                parent={category.handle}
                selected={selected}
                toggle={toggle}
              />
            )}
          </li>
        ))}
    </ul>
  )
}

export function CatalogList({ products }: { products: CatalogProduct[] }) {
  const { colorMap } = useCommerce()
  const params = useSearchParams()
  const filters = catalogQuery(params)
  const results = catalogResults(products, filters)
  const [mobileFilters, setMobileFilters] = useState(false)
  const [brandSearch, setBrandSearch] = useState("")
  const categories = categoriesFrom(products)
  const brands = [
    ...new Map(
      products.flatMap(({ brand }) =>
        brand ? [[brand.handle, brand] as const] : []
      )
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name, "fa"))
  const colors = [
    ...new Set(
      products.flatMap(({ variants }) =>
        variants.flatMap(({ color }) => (color ? [color] : []))
      )
    ),
  ]
  const availableSizes = [
    ...new Set(
      products.flatMap(({ variants }) =>
        variants.flatMap(({ size }) =>
          size ? [normalizeText(size).toUpperCase()] : []
        )
      )
    ),
  ]

  function update(apply: (next: URLSearchParams) => void) {
    const url = new URL(window.location.href)
    apply(url.searchParams)
    if (url.href !== window.location.href)
      window.history.pushState(null, "", url)
  }

  function toggle(key: string, value: string) {
    update((next) => {
      if (next.getAll(key).includes(value)) next.delete(key, value)
      else next.append(key, value)
    })
  }

  const chips = [
    ...filters.categories.map((value) => ({
      key: "category",
      value,
      label:
        categories.find((category) => category.handle === value)?.name ?? value,
    })),
    ...filters.brands.map((value) => ({
      key: "brand",
      value,
      label: brands.find((brand) => brand.handle === value)?.name ?? value,
    })),
    ...filters.sizes.map((value) => ({
      key: "size",
      value,
      label: `سایز ${sizeLabel(value)}`,
    })),
    ...filters.colors.map((value) => ({ key: "color", value, label: value })),
    ...(filters.q ? [{ key: "q", label: `«${filters.q}»` }] : []),
    ...(filters.min !== undefined || filters.max !== undefined
      ? [
          {
            key: "price",
            label:
              filters.min === undefined
                ? `تا ${price(filters.max!)}`
                : filters.max === undefined
                  ? `از ${price(filters.min)}`
                  : `${number(filters.min)} تا ${price(filters.max)}`,
          },
        ]
      : []),
    ...(filters.stock ? [{ key: "stock", label: "فقط موجود" }] : []),
    ...(filters.sale ? [{ key: "sale", label: "فقط تخفیف‌دار" }] : []),
  ]

  function clear() {
    update((next) => FACETS.forEach((key) => next.delete(key)))
  }
  function setFlag(key: string, checked: boolean) {
    update((next) => (checked ? next.set(key, "1") : next.delete(key)))
  }

  const controls = (
    <div className="store-filter-controls">
      {categories.length > 0 && (
        <details open>
          <summary>دسته‌بندی</summary>
          <CategoryTree
            categories={categories}
            selected={filters.categories}
            toggle={(value) => toggle("category", value)}
          />
        </details>
      )}
      {brands.length > 0 && (
        <details open>
          <summary>برند</summary>
          <input
            type="search"
            value={brandSearch}
            placeholder="جستجوی برند"
            aria-label="جستجوی برند"
            onChange={(event) => setBrandSearch(event.target.value)}
          />
          <div className="store-filter-brands">
            {brands
              .filter((brand) =>
                matchesText(brandSearch, brand.name, brand.handle)
              )
              .map((brand) => (
                <label key={brand.handle}>
                  <input
                    type="checkbox"
                    checked={filters.brands.includes(brand.handle)}
                    onChange={() => toggle("brand", brand.handle)}
                  />
                  {brand.name}
                </label>
              ))}
            {!brands.some((brand) =>
              matchesText(brandSearch, brand.name, brand.handle)
            ) && <small className="store-muted">برندی یافت نشد.</small>}
          </div>
        </details>
      )}
      {availableSizes.length > 0 && (
        <details open>
          <summary>سایز</summary>
          <div className="store-size-options">
            {[
              ...SIZES,
              ...availableSizes.filter((size) => !SIZES.includes(size)),
            ].map((size) => {
              const selected = filters.sizes.find(
                (value) => normalizeText(value).toUpperCase() === size
              )
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={Boolean(selected)}
                  disabled={!selected && !availableSizes.includes(size)}
                  onClick={() => toggle("size", selected ?? size)}
                >
                  {sizeLabel(size)}
                </button>
              )
            })}
          </div>
        </details>
      )}
      {colors.length > 0 && (
        <details open>
          <summary>رنگ</summary>
          <div className="store-filter-colors">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className="store-swatch"
                style={{ backgroundColor: colorHex(color, colorMap) }}
                title={color}
                aria-label={color}
                aria-pressed={filters.colors.includes(color)}
                onClick={() => toggle("color", color)}
              />
            ))}
          </div>
        </details>
      )}
      <details open>
        <summary>بازه قیمت (تومان)</summary>
        <form
          className="store-price-form"
          key={`${filters.min}-${filters.max}`}
          onSubmit={(event) => {
            event.preventDefault()
            const form = new FormData(event.currentTarget)
            const valid = (entry: FormDataEntryValue | null) =>
              normalizeText(String(entry ?? "")).replace(/[٬,\s]/g, "")
            const min = valid(form.get("min"))
            const max = valid(form.get("max"))
            const field = event.currentTarget.elements.namedItem(
              "max"
            ) as HTMLInputElement
            if (
              [min, max].some(
                (value) =>
                  value &&
                  (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
              )
            ) {
              field.setCustomValidity("مبلغ را به‌صورت عدد صحیح وارد کنید.")
              field.reportValidity()
              return
            }
            update((next) => {
              if (min && max && Number(min) > Number(max)) {
                next.set("min", max)
                next.set("max", min)
                return
              }
              for (const [key, value] of [
                ["min", min],
                ["max", max],
              ])
                value ? next.set(key, value) : next.delete(key)
            })
          }}
          onInput={(event) =>
            (
              event.currentTarget.elements.namedItem("max") as HTMLInputElement
            ).setCustomValidity("")
          }
        >
          <label>
            از
            <input
              name="min"
              defaultValue={filters.min}
              inputMode="numeric"
              placeholder="۰"
            />
          </label>
          <label>
            تا
            <input
              name="max"
              defaultValue={filters.max}
              inputMode="numeric"
              placeholder="بدون محدودیت"
            />
          </label>
          <button type="submit" className="store-button store-outline">
            اعمال قیمت
          </button>
        </form>
      </details>
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={filters.stock}
          onChange={(event) => setFlag("stock", event.target.checked)}
        />{" "}
        فقط کالاهای موجود
      </label>
      <label>
        <input
          type="checkbox"
          role="switch"
          checked={filters.sale}
          onChange={(event) => setFlag("sale", event.target.checked)}
        />{" "}
        فقط کالاهای تخفیف‌دار
      </label>
    </div>
  )

  return (
    <div className="store-catalog-layout">
      <aside className="store-filters" aria-label="فیلتر محصولات">
        <div className="store-filters-heading">
          <h2>فیلترها</h2>
          {chips.length > 0 && (
            <button type="button" onClick={clear}>
              پاک کردن
            </button>
          )}
        </div>
        {controls}
      </aside>
      <div className="store-catalog-results">
        <div className="store-sortbar">
          <button
            className="store-button store-outline store-mobile-filter"
            type="button"
            onClick={() => setMobileFilters(true)}
          >
            <Icon name="filter" size={17} />
            فیلترها{chips.length > 0 && ` (${number(chips.length)})`}
          </button>
          <label>
            مرتب‌سازی{" "}
            <select
              value={filters.sort}
              onChange={(event) => {
                const value = event.target.value
                update((next) => next.set("sort", value))
              }}
            >
              {SORTS.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <span role="status">{number(results.length)} کالا</span>
        </div>
        {chips.length > 0 && (
          <div className="store-chips" aria-label="فیلترهای فعال">
            {chips.map((chip) => (
              <button
                type="button"
                key={`${chip.key}:${"value" in chip ? chip.value : ""}`}
                onClick={() =>
                  "value" in chip
                    ? toggle(chip.key, chip.value)
                    : update((next) =>
                        (chip.key === "price"
                          ? ["min", "max"]
                          : [chip.key]
                        ).forEach((key) => next.delete(key))
                      )
                }
                aria-label={`حذف فیلتر ${chip.label}`}
              >
                {chip.label}
                <Icon name="close" size={13} />
              </button>
            ))}
          </div>
        )}
        {results.length > 0 ? (
          <div className="store-product-grid">
            {results.map(({ product, variants }) => (
              <ProductCard
                key={product.id}
                product={product}
                variants={variants}
                fluid
              />
            ))}
          </div>
        ) : (
          <div className="store-empty">
            <Icon name="search" size={32} />
            <h2>محصولی پیدا نشد</h2>
            <p>فیلترها یا عبارت جستجو را تغییر دهید.</p>
            {chips.length > 0 && (
              <button className="store-button" type="button" onClick={clear}>
                پاک کردن فیلترها
              </button>
            )}
          </div>
        )}
      </div>
      {mobileFilters && (
        <Modal
          label="فیلتر محصولات"
          onClose={() => setMobileFilters(false)}
          className="store-mobile-filters-modal"
        >
          {controls}
          <div className="store-mobile-filters-action">
            <button
              className="store-button store-outline"
              type="button"
              onClick={clear}
            >
              پاک کردن
            </button>
            <button
              className="store-button"
              type="button"
              onClick={() => setMobileFilters(false)}
            >
              نمایش {number(results.length)} کالا
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
