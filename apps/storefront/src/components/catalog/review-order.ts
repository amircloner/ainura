import type { CatalogReview } from "../../lib/seed-data"

export function orderReviews(
  reviews: CatalogReview[],
  sort: "newest" | "buyers" | "helpful",
  feedback: Record<string, { helpful: number; unhelpful: number }>
) {
  const score = (id: string) =>
    (feedback[id]?.helpful ?? 0) - (feedback[id]?.unhelpful ?? 0)
  const time = (review: CatalogReview) => Date.parse(review.created_at) || 0
  return reviews
    .filter((review) => sort !== "buyers" || review.verified_purchase)
    .sort(
      (a, b) =>
        (sort === "helpful" && score(b.id) - score(a.id)) || time(b) - time(a)
    )
}
