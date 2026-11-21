import assert from "node:assert/strict"
import { test } from "node:test"
import { demoProducts } from "../../lib/seed-data.ts"
import {
  catalogQuery,
  catalogResults,
  categoryTrail,
  matchesProduct,
} from "./catalog.ts"

test("catalog facets share one variant and use Toman bounds and Persian search", () => {
  const [shoe] = demoProducts
  const product = {
    ...shoe,
    currency: "irr",
    variants: shoe.variants.map((variant) => ({
      ...variant,
      price: variant.price * 10,
      originalPrice: variant.originalPrice * 10,
    })),
  }
  const find = (query: string) =>
    catalogResults([product], catalogQuery(new URLSearchParams(query)))
  assert.equal(matchesProduct(product, "كفش يلسان KLR-۶۰۱"), true)
  assert.deepEqual(
    categoryTrail(product.category).map((category) => category.handle),
    ["women", "women-shoes", "women-casual-shoes"]
  )
  assert.equal(
    find("category=women&brand=yelsan&brand=dorsa&size=۴۱&color=مشکی&stock=1")
      .length,
    0
  )
  assert.equal(
    find(
      "category=women&size=۴۱&color=زرشکی&stock=1&sale=1&min=۲٬۴۰۰٬۰۰۰&max=۲۵۰۰۰۰۰"
    )[0].variants.length,
    1
  )
  assert.equal(find("max=۲۴۰۰۰۰۰").length, 0)
})
