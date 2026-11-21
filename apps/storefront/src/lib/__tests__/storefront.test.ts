import assert from "node:assert/strict"
import { test } from "node:test"
import { formatPrice, latinDigits, reviewStats, toPersian } from "../format.ts"
import { demoBrands, demoProducts, demoReviews } from "../seed-data.ts"

test("Persian digits and Toman conversion", () => {
  assert.equal(toPersian("KLR-601"), "KLR-۶۰۱")
  assert.equal(latinDigits("۰۹۱٢۳۴۵۶۷۸۹"), "09123456789")
  assert.equal(formatPrice(24_900_000, "irr"), formatPrice(2_490_000))
  assert.match(formatPrice(80, "eur"), /EUR/)
})

test("Clara fixture has unique color/size variants, full size guide, and review stats", () => {
  assert.equal(demoBrands.length, 6)
  assert.ok(demoProducts.length >= 16)
  const [clara] = demoProducts
  assert.equal(clara.metadata.product_code, "KLR-601")
  assert.equal(new Set(clara.variants.map(({ id }) => id)).size, 18)
  assert.equal(clara.metadata.size_guide?.rows.length, 6)
  const stats = reviewStats(clara.id, demoReviews)
  assert.equal(stats.recommendation_percentage, 88)
  assert.equal(
    Object.values(stats.distribution).reduce((sum, count) => sum + count),
    stats.total_count
  )
  assert.equal(reviewStats(clara.id, []).average_rating, 0)
})
