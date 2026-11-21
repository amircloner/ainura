export const toPersian = (value: string | number) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)])

export const latinDigits = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) => String(digit.charCodeAt(0) & 15))

export function formatPrice(amount: number, currency = "irt") {
  const code = currency.toLowerCase()
  const format = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 2 })
  if (code === "irr" || code === "irt") {
    return `${format.format(code === "irr" ? amount / 10 : amount)} تومان`
  }
  return `${format.format(amount)} ${code.toUpperCase()}`
}

export function reviewStats<
  T extends { rating: number; is_recommended?: boolean },
>(product_id: string, reviews: T[]) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let sum = 0
  let recommended = 0
  for (const review of reviews) {
    if (review.rating in distribution)
      distribution[review.rating as keyof typeof distribution]++
    sum += review.rating
    recommended += Number(review.is_recommended === true)
  }
  return {
    product_id,
    average_rating: reviews.length
      ? Math.round((sum * 10) / reviews.length) / 10
      : 0,
    total_count: reviews.length,
    recommendation_percentage: reviews.length
      ? Math.round((recommended * 100) / reviews.length)
      : 0,
    distribution,
  }
}
