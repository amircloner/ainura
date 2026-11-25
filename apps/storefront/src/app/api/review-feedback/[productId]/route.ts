import {
  allReviewPages,
  type ReviewVote,
} from "../../../../lib/review-feedback.ts"
import { reviewVotes } from "../../../../lib/server/review-votes.ts"

export const runtime = "nodejs"

const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Vary: "Authorization" },
  })
const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[\w-]{1,200}$/.test(id)

async function feedback(
  request: Request,
  context: { params: Promise<{ productId: string }> }
) {
  const { productId } = await context.params
  if (!validId(productId)) return json({ error: "Invalid product ID" }, 400)
  const auth = request.headers.get("authorization")
  const write = request.method === "PUT"
  if ((write || auth !== null) && !/^Bearer \S+$/i.test(auth ?? "")) {
    return json({ error: "Customer sign-in required" }, 401)
  }
  let change: { review_id: string; vote: ReviewVote | null } | undefined
  if (write) {
    const body = await request.json().catch(() => null)
    if (
      !validId(body?.review_id) ||
      ![null, "helpful", "unhelpful"].includes(body.vote) ||
      Object.keys(body).length !== 2
    ) {
      return json({ error: "Expected review_id and vote" }, 400)
    }
    change = { review_id: body.review_id, vote: body.vote }
  }
  const base = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const key = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  if (!base || !key) return json({ error: "Store unavailable" }, 503)
  async function store(path: string, token?: string) {
    const response = await fetch(`${base}${path}`, {
      headers: {
        "x-publishable-api-key": key!,
        ...(token ? { Authorization: token } : {}),
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(4000),
    })
    if (!response.ok) {
      if (token && [401, 403, 404].includes(response.status))
        throw json({ error: "Customer sign-in required" }, 401)
      if (response.status === 404)
        throw json({ error: "Product not found" }, 404)
      throw new Error("Store unavailable")
    }
    return response.json()
  }
  try {
    const customer = auth
      ? (await store("/store/customers/me?fields=id", auth)).customer?.id
      : null
    if (auth && !validId(customer))
      return json({ error: "Customer sign-in required" }, 401)
    // Medusa enforces sales channel visibility and review approval. Do not trust IDs from the browser.
    const { reviews } = await allReviewPages<
      { id: string; product_id: string; status: string },
      unknown
    >((offset) =>
      store(
        `/store/products/${productId}/reviews?fields=id,product_id,status&order=-id&limit=100&offset=${offset}`
      )
    )
    const ids = reviews
      .filter(
        (review) =>
          review.product_id === productId && review.status === "approved"
      )
      .map((review) => review.id)
    if (change && !ids.includes(change.review_id))
      return json({ error: "Review not found" }, 404)
    const counts = reviewVotes(
      productId,
      change ? [change.review_id] : ids,
      customer,
      change
    )
    return json(change ? counts[change.review_id] : counts)
  } catch (error) {
    if (error instanceof Response) return error
    return json({ error: "Feedback unavailable" }, 503)
  }
}

export { feedback as GET, feedback as PUT }
