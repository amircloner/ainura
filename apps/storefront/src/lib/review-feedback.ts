export type ReviewVote = "helpful" | "unhelpful"
export type ReviewFeedback = {
  helpful: number
  unhelpful: number
  current_vote: ReviewVote | null
}

// The store reviews API is paginated, even when client-side filters need all rows.
export async function allReviewPages<T extends { id: string }, S>(
  load: (offset: number) => Promise<{ reviews: T[]; count: number; stats?: S }>
) {
  const first = await load(0)
  const reviews = new Map(first.reviews.map((review) => [review.id, review]))
  for (let offset = first.reviews.length; offset < first.count;) {
    const page = await load(offset)
    if (!page.reviews.length) break
    for (const review of page.reviews) reviews.set(review.id, review)
    offset += page.reviews.length
  }
  return { reviews: Array.from(reviews.values()), stats: first.stats }
}
