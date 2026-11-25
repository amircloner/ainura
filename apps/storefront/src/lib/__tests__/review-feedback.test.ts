import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { GET, PUT } from "../../app/api/review-feedback/[productId]/route.ts"

test("only approved product reviews accept one persistent vote per verified customer", async (t) => {
  const directory = mkdtempSync(join(tmpdir(), "ainura-votes-"))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  process.env.REVIEW_FEEDBACK_DB_PATH = join(directory, "votes.sqlite")
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL = "http://store.test"
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY = "test"

  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    const path = new URL(url)
    if (path.pathname === "/store/customers/me") {
      const token = new Headers(init.headers).get("Authorization")
      if (token === "Bearer a" || token === "Bearer b")
        return Response.json({ customer: { id: `cus_${token.slice(-1)}` } })
      return new Response(null, { status: 401 })
    }
    assert.equal(path.pathname, "/store/products/p1/reviews")
    const reviews = [
      { id: "pending", product_id: "p1", status: "pending" },
      { id: "other", product_id: "p2", status: "approved" },
      { id: "r", product_id: "p1", status: "approved" },
    ]
    const offset = Number(path.searchParams.get("offset"))
    return Response.json({
      reviews: reviews.slice(offset, offset + 2),
      count: 3,
    })
  })
  const call = (token?: string, body?: unknown) => {
    const request = new Request("http://test/api/review-feedback/p1", {
      method: body ? "PUT" : "GET",
      body: body ? JSON.stringify(body) : undefined,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    return (body ? PUT : GET)(request, {
      params: Promise.resolve({ productId: "p1" }),
    })
  }
  const up = { review_id: "r", vote: "helpful" }
  const empty = { helpful: 0, unhelpful: 0, current_vote: null }
  assert.deepEqual(await (await call()).json(), { r: empty })
  assert.equal((await call(undefined, up)).status, 401)
  assert.equal((await call("invalid", up)).status, 401)
  assert.equal((await call("a", { ...up, customer_id: "cus_b" })).status, 400)
  assert.equal((await call("a", { ...up, vote: 3 })).status, 400)
  for (const review_id of ["pending", "other", "missing"]) {
    assert.equal((await call("a", { ...up, review_id })).status, 404)
  }
  for (let i = 0; i < 2; i++) {
    assert.deepEqual(await (await call("a", up)).json(), {
      helpful: 1,
      unhelpful: 0,
      current_vote: "helpful",
    })
  }
  await call("b", up)
  assert.deepEqual(
    await (await call("a", { ...up, vote: "unhelpful" })).json(),
    { helpful: 1, unhelpful: 1, current_vote: "unhelpful" }
  )
  assert.deepEqual(await (await call("b")).json(), {
    r: { helpful: 1, unhelpful: 1, current_vote: "helpful" },
  })
  assert.deepEqual(await (await call("a", { ...up, vote: null })).json(), {
    helpful: 1,
    unhelpful: 0,
    current_vote: null,
  })
  const publicRead = await call()
  assert.match(publicRead.headers.get("cache-control")!, /private, no-store/)
  assert.deepEqual(await publicRead.json(), {
    r: { helpful: 1, unhelpful: 0, current_vote: null },
  })
})
