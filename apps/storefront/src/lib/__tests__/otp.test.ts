import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { test, type TestContext } from "node:test"
import { POST as request } from "../../app/api/auth/otp/request/route.ts"
import { POST as verify } from "../../app/api/auth/otp/verify/route.ts"
import { normalizeDigits, normalizeIranMobile } from "../otp-input.ts"
import { OtpLimit, OtpStore } from "../server/otp-store.ts"

const mobile = "+989120000000"
function body(data: object, headers: Record<string, string> = {}) {
  return new Request("https://store.test", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "content-type": "application/json", ...headers },
  })
}

function fixture(t: TestContext) {
  const dir = mkdtempSync(join(tmpdir(), "otp-test-"))
  const path = join(dir, "otp.sqlite")
  const config = {
    OTP_DB_PATH: path,
    OTP_CHALLENGE_SECRET: "p".repeat(40),
    OTP_ASSERTION_SECRET: "s".repeat(40),
    OTP_MEDUSA_URL: "https://medusa.test",
    IPPANEL_API_KEY: "test-key",
    IPPANEL_SENDER_NUMBER: "+983000505",
    IPPANEL_PATTERN_CODE: "test-pattern",
    IPPANEL_PATTERN_PARAM: "otp",
    OTP_TRUSTED_IP_HEADER: "",
  }
  const previous = Object.fromEntries(
    Object.keys(config).map((k) => [k, process.env[k]])
  )
  Object.assign(process.env, config)
  t.after(() => {
    for (const [k, v] of Object.entries(previous)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
    rmSync(dir, { recursive: true, force: true })
  })
  return {
    path,
    store: new OtpStore(path, config.OTP_CHALLENGE_SECRET),
    config,
  }
}

test("Iran mobile and six-digit input share canonical Persian, Arabic and Latin digits", () => {
  for (const phone of [
    "۰۹۱۲ ۰۰۰ ۰۰۰۰",
    "٠٠٩٨٩١٢٠٠٠٠٠٠٠",
    "+98 (912) 000-0000",
    "989120000000",
    "9120000000",
  ]) {
    assert.equal(normalizeIranMobile(phone), mobile)
  }
  for (const phone of [
    "0912garbage0000000",
    "+9809120000000",
    "02100000000",
    "+1 9120000000",
  ])
    assert.equal(normalizeIranMobile(phone), null)
  assert.equal(normalizeDigits("۰١۲٣۴٥"), "012345")
})

test("routes: IPPanel Edge request, cooldown, one consume, one signed S2S exchange, final token only", async (t) => {
  const { config, path } = fixture(t)
  let code = "",
    sends = 0,
    exchanges = 0
  const token = `header.${Buffer.from(JSON.stringify({ actor_type: "customer", actor_id: "cus_1", auth_identity_id: "auth_1" })).toString("base64url")}.signature`
  t.mock.method(
    globalThis,
    "fetch",
    async (url: URL | string, init: RequestInit) => {
      assert.equal(init.redirect, "error")
      assert.equal(init.cache, "no-store")
      const data = JSON.parse(String(init.body))
      if (String(url) === "https://edge.ippanel.com/v1/api/send") {
        sends++
        assert.equal(new Headers(init.headers).get("Authorization"), "test-key")
        code = data.params.otp
        assert.match(code, /^\d{6}$/)
        assert.deepEqual(data, {
          sending_type: "pattern",
          from_number: "+983000505",
          code: "test-pattern",
          recipients: ["09120000000"],
          params: { otp: code },
        })
        return Response.json({
          meta: { status: true },
        })
      }
      assert.equal(String(url), "https://medusa.test/auth/customer/phone-otp")
      assert.deepEqual(Object.keys(data), ["assertion"])
      const [h, p, signature] = data.assertion.split(".")
      assert.equal(
        JSON.parse(Buffer.from(h, "base64url").toString()).alg,
        "HS256"
      )
      assert.equal(
        signature,
        createHmac("sha256", config.OTP_ASSERTION_SECRET)
          .update(`${h}.${p}`)
          .digest("base64url")
      )
      const claims = JSON.parse(Buffer.from(p, "base64url").toString())
      assert.equal(claims.sub, mobile)
      assert.equal(claims.iss, "ainura-otp")
      assert.equal(claims.aud, "medusa:customer:phone-otp")
      assert.equal(claims.exp - claims.iat, 45)
      assert.match(
        claims.jti,
        /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/
      )
      exchanges++
      return Response.json({ token })
    }
  )
  const results = await Promise.all([
    request(body({ phone: mobile })),
    request(body({ phone: "۰۹۱۲۰۰۰۰۰۰۰" })),
  ])
  assert.equal(sends, 1)
  const ok = results.find((r) => r.status === 200)!,
    limited = results.find((r) => r.status === 429)!
  assert.deepEqual(await ok.json(), { retryAfter: 60 })
  assert.ok(Number(limited.headers.get("Retry-After")) > 0)
  assert.deepEqual(Object.keys(await limited.json()), ["message"])
  const db = new DatabaseSync(path)
  try {
    const row = db.prepare("SELECT phone, digest FROM otp_challenge").get()!
    assert.match(String(row.phone), /^[a-f\d]{64}$/)
    assert.match(String(row.digest), /^[a-f\d]{64}$/)
  } finally {
    db.close()
  }
  const localized = code.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
  const checks = await Promise.all([
    verify(body({ phone: mobile, code: localized })),
    verify(body({ phone: mobile, code })),
  ])
  assert.equal(exchanges, 1)
  assert.deepEqual(await checks.find((r) => r.status === 200)!.json(), {
    token,
  })
  assert.equal(
    checks.find((r) => r.status === 200)!.headers.get("Cache-Control"),
    "no-store"
  )
  assert.deepEqual(
    Object.keys(await checks.find((r) => r.status === 401)!.json()),
    ["message"]
  )
})

test("generation guards, attempt exhaustion, expiry, persistent phone budget", (t) => {
  const { store } = fixture(t)
  let now = Date.now()
  t.mock.method(Date, "now", () => now)
  const a = store.reserve(mobile, null, "001111")
  assert.equal(store.consume(mobile, null, "001111"), false) // pending
  now += 60_001
  const b = store.reserve(mobile, null, "002222")
  assert.equal(store.finish(mobile, a, false), false)
  assert.equal(store.finish(mobile, a, true), false)
  assert.equal(store.finish(mobile, b, true), true)
  for (let i = 0; i < 5; i++)
    assert.equal(store.consume(mobile, null, "001111"), false)
  assert.equal(store.consume(mobile, null, "002222"), false)
  now += 60_001
  const c = store.reserve(mobile, null, "003333")
  store.finish(mobile, c, true)
  now += 180_000
  assert.equal(store.consume(mobile, null, "003333"), false)
  for (let i = 0; i < 2; i++)
    assert.equal(store.consume(mobile, null, "003333"), false)
  assert.throws(() => store.consume(mobile, null, "003333"), OtpLimit)
  for (let i = 0; i < 2; i++) {
    store.reserve(mobile, null, "000000")
    now += 60_001
  }
  assert.throws(() => store.reserve(mobile, null, "000000"), OtpLimit)
})

test("send budget enforced per IP and globally across distinct phones", (t) => {
  const { store } = fixture(t)
  const phone = (i: number) => `+989${String(i).padStart(9, "0")}`
  for (let i = 0; i < 15; i++) store.reserve(phone(i), "192.0.2.1", "000000")
  assert.throws(() => store.reserve(phone(15), "192.0.2.1", "000000"), OtpLimit)
  for (let i = 15; i < 120; i++) store.reserve(phone(i), null, "000000")
  assert.throws(() => store.reserve(phone(120), null, "000000"), OtpLimit)
})

test("missing config, malformed input and untrusted proxy data cannot trigger network; provider failure invalidates", async (t) => {
  const { config, store } = fixture(t)
  let calls = 0,
    code = ""
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      calls++
      code = JSON.parse(String(init.body)).params.otp
      return Response.json({
        meta: { status: false, message: "private provider detail" },
      })
    }
  )
  delete process.env.OTP_ASSERTION_SECRET
  assert.equal((await request(body({ phone: mobile }))).status, 503)
  process.env.OTP_ASSERTION_SECRET = config.OTP_ASSERTION_SECRET
  assert.equal(
    (await verify(body({ phone: mobile, code: 123456 }))).status,
    400
  )
  assert.equal(
    (await verify(body({ phone: mobile, code: "1234567" }))).status,
    400
  )
  assert.equal(
    (await request(body({ phone: mobile, extra: "x".repeat(2000) }))).status,
    400
  )
  process.env.OTP_TRUSTED_IP_HEADER = "x-client-ip"
  assert.equal(
    (await request(body({ phone: mobile }, { "x-forwarded-for": "192.0.2.5" })))
      .status,
    503
  )
  assert.equal(
    (
      await request(
        body({ phone: mobile }, { "x-client-ip": "192.0.2.1, 192.0.2.2" })
      )
    ).status,
    503
  )
  assert.equal(calls, 0)
  const reply = await request(
    body({ phone: mobile }, { "x-client-ip": "2001:db8::1" })
  )
  assert.equal(calls, 1)
  assert.equal(reply.status, 503)
  assert.equal(reply.headers.get("Retry-After"), "60")
  assert.doesNotMatch(await reply.text(), /private provider detail/)
  assert.equal(store.consume(mobile, null, code), false)
})

test("exchange failure and registration/intermediate responses never leak tokens or reopen challenges", async (t) => {
  const { store } = fixture(t)
  const actorless = `header.${Buffer.from(JSON.stringify({ actor_type: "customer", auth_identity_id: "auth_1", actor_id: "" })).toString("base64url")}.sig`
  const replies = [
    Response.json({ token: actorless }),
    Response.json({ mfa_required: true, token: actorless }),
    new Response(null, { status: 500 }),
  ]
  t.mock.method(globalThis, "fetch", async () => replies.shift())
  for (let i = 0; i < 3; i++) {
    const phone = `+98912000000${i}`
    store.finish(phone, store.reserve(phone, null, "123456"), true)
    const reply = await verify(body({ phone, code: "123456" }))
    assert.equal(reply.status, 503)
    assert.deepEqual(Object.keys(await reply.json()), ["message"])
    assert.equal((await verify(body({ phone, code: "123456" }))).status, 401)
  }
})
