import assert from "node:assert/strict"
import test from "node:test"
import { formatPrice, reviewStats, toPersian } from "../format.ts"
import type { CatalogReview } from "../seed-data.ts"

test("formatPrice formats Toman and converts Rial values to Toman", () => {
  assert.equal(formatPrice(1_690_000), "۱٬۶۹۰٬۰۰۰ تومان")
  assert.equal(formatPrice(16_900_000, "irr"), "۱٬۶۹۰٬۰۰۰ تومان")
  assert.equal(toPersian("36 - 41"), "۳۶ - ۴۱")
})

test("reviewStats computes rating distribution and recommendation rate", () => {
  const sampleReviews: CatalogReview[] = [
    {
      id: "rev_1",
      customer_name: "نگین",
      rating: 5,
      title: "عالی",
      content: "دوخت تمیز",
      pros: [],
      cons: [],
      is_recommended: true,
      verified_purchase: true,
      created_at: "2026-11-10T10:00:00.000Z",
    },
    {
      id: "rev_2",
      customer_name: "مریم",
      rating: 4,
      title: "خوب",
      content: "تنخور مناسب",
      pros: [],
      cons: [],
      is_recommended: true,
      verified_purchase: true,
      created_at: "2026-11-04T14:30:00.000Z",
    },
  ]
  const stats = reviewStats("prod_22797531", sampleReviews)
  assert.equal(stats.total_count, 2)
  assert.equal(stats.average_rating, 4.5)
  assert.equal(stats.distribution[5], 1)
  assert.equal(stats.distribution[4], 1)
  assert.equal(stats.recommendation_percentage, 100)
})
