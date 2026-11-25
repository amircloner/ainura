import assert from "node:assert/strict"
import test from "node:test"
import { orderReviews } from "./review-order.ts"
import type { CatalogReview } from "../../lib/seed-data.ts"
import type { CatalogProduct } from "../../lib/seed-data.ts"
import {
  catalogQuery,
  catalogResults,
  colorHex,
  matchesProduct,
  tagsFrom,
} from "./catalog.ts"

test("review ordering distinguishes helpful, recent, and verified buyers", () => {
  const review: CatalogReview = {
    id: "older",
    created_at: "2026-01-01",
    customer_name: "A",
    rating: 4,
    content: "Review",
    is_recommended: true,
    verified_purchase: true,
  }
  const reviews = [
    review,
    {
      ...review,
      id: "newer",
      created_at: "2026-02-01",
      verified_purchase: false,
    },
  ]
  const feedback = {
    older: { helpful: 3, unhelpful: 1 },
    newer: { helpful: 4, unhelpful: 4 },
  }
  assert.equal(orderReviews(reviews, "helpful", feedback)[0].id, "older")
  assert.equal(orderReviews(reviews, "newest", feedback)[0].id, "newer")
  assert.deepEqual(orderReviews(reviews, "buyers", feedback), [review])
  assert.equal(reviews[0].id, "older")
})

const sampleCatalog: CatalogProduct[] = [
  {
    id: "prod_1",
    handle: "22797531-jacket",
    title: "کاپشن زنانه شمعی ام کی مدل L2005",
    description: "کاپشن زنانه شمعی",
    category: {
      handle: "women-warm-jacket",
      name: "کاپشن زنانه",
      parent: { handle: "womens-apparel", name: "زنانه" },
    },
    categories: [
      {
        handle: "women-warm-jacket",
        name: "کاپشن زنانه",
        parent: { handle: "womens-apparel", name: "زنانه" },
      },
      {
        handle: "winter-collection",
        name: "کلکسیون زمستانه",
      },
    ],
    tags: [
      {
        id: "ptag_1",
        value: "زمستانی",
        handle: "winter",
        description: "پوشاک فصل سرد",
      },
    ],
    brand: {
      id: "brand_1",
      name: "ام کی",
      handle: "mk",
      logo_url: null,
      banner_url: null,
      description: null,
      is_featured: true,
      country: null,
    },
    images: ["https://example.com/1.jpg"],
    variants: [
      {
        id: "var_1",
        color: "آجری",
        size: "M",
        price: 10_913_000,
        originalPrice: 15_590_000,
        available: true,
      },
      {
        id: "var_2",
        color: "مشکی",
        size: "L",
        price: 15_590_000,
        originalPrice: 15_590_000,
        available: false,
      },
    ],
    metadata: {},
    created_at: "2026-11-20T00:00:00.000Z",
  },
]

test("catalog filtering matches Persian variants, prices, stock, and discounts", () => {
  const [jacket] = sampleCatalog
  assert.equal(matchesProduct(jacket, "كاپشن"), true)
  assert.equal(
    catalogResults(
      sampleCatalog,
      catalogQuery(new URLSearchParams("category=womens-apparel&color=آجری"))
    ).length,
    1
  )
  assert.equal(
    catalogResults(
      sampleCatalog,
      catalogQuery(new URLSearchParams("sale=1&stock=1&max=12000000"))
    ).length,
    1
  )
  assert.equal(
    catalogResults(
      sampleCatalog,
      catalogQuery(new URLSearchParams("size=L&stock=1"))
    ).length,
    0
  )
})

test("colorHex resolves dynamic DB color map with Persian normalization", () => {
  const dbColors = { آجری: "#C45A3F", "سرمه ای": "#28364F" }
  assert.equal(colorHex("آجری", dbColors), "#C45A3F")
  assert.equal(colorHex("سرمه‌ای", dbColors), "#28364F")
  assert.equal(colorHex("#123456", dbColors), "#123456")
  assert.equal(colorHex("نامشخص", dbColors), "#e6e1dc")
})

test("catalog filtering supports WooCommerce-style multi-categories and tags", () => {
  const [jacket] = sampleCatalog
  assert.equal(tagsFrom(sampleCatalog).length, 1)
  assert.equal(matchesProduct(jacket, "زمستانی"), true)
  assert.equal(
    catalogResults(
      sampleCatalog,
      catalogQuery(new URLSearchParams("tag=winter"))
    ).length,
    1
  )
  assert.equal(
    catalogResults(
      sampleCatalog,
      catalogQuery(new URLSearchParams("tag=summer"))
    ).length,
    0
  )
  assert.equal(
    catalogResults(
      sampleCatalog,
      catalogQuery(new URLSearchParams("category=winter-collection"))
    ).length,
    1
  )
})
