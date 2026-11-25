import { createHmac, randomInt, randomUUID } from "node:crypto"
import { isIP } from "node:net"
import { isAbsolute } from "node:path"
import { normalizeDigits, normalizeIranMobile } from "../otp-input.ts"
import { OtpLimit, OtpStore, retryAfter } from "./otp-store.ts"

class SmsDeliveryError extends Error {}

function required(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw new Error("OTP configuration missing")
  return value
}

function config() {
  const path = required("OTP_DB_PATH")
  const pepper = required("OTP_CHALLENGE_SECRET")
  const secret = required("OTP_ASSERTION_SECRET")
  const backend = new URL(required("OTP_MEDUSA_URL"))
  const sender = process.env.IPPANEL_SENDER_NUMBER?.trim() || required("IPPANEL_FROM_NUMBER")
  const param = required("IPPANEL_PATTERN_PARAM")
  const loopback = ["127.0.0.1", "[::1]", "localhost"].includes(
    backend.hostname
  )
  if (
    !isAbsolute(path) ||
    Buffer.byteLength(pepper) < 32 ||
    Buffer.byteLength(secret) < 32 ||
    pepper === secret ||
    !(
      backend.protocol === "https:" ||
      (loopback && backend.protocol === "http:")
    ) ||
    backend.username ||
    backend.password ||
    backend.pathname !== "/" ||
    backend.search ||
    backend.hash ||
    !/^\+[1-9]\d{3,14}$/.test(sender)
  ) {
    throw new Error("OTP configuration invalid")
  }
  return {
    store: new OtpStore(path, pepper),
    secret,
    backend,
    sender,
    param,
    pattern: required("IPPANEL_PATTERN_CODE"),
    apiKey: required("IPPANEL_API_KEY"),
  }
}

function trustedIp(headers: Headers) {
  const header = process.env.OTP_TRUSTED_IP_HEADER?.trim()
  if (!header) return null // Never infer trust from the presence of forwarding headers.
  const raw = headers.get(header) ?? ""
  const version = isIP(raw)
  if (!version || raw.includes("%"))
    throw new Error("Trusted proxy address unavailable")
  return version === 6 ? new URL(`http://[${raw}]`).hostname : raw
}

async function post(
  url: string | URL,
  body: object,
  headers?: Record<string, string>
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  })
  if (!response.ok) throw new Error("OTP upstream unavailable")
  return response.json()
}

async function send(
  phone: string,
  ip: string | null,
  cfg: ReturnType<typeof config>
) {
  const code = randomInt(1_000_000).toString().padStart(6, "0")
  const generation = cfg.store.reserve(phone, ip, code)
  try {
    // Sora Connect's sendPattern uses a domestic recipient; identity stays E.164.
    const reply = await post(
      "https://edge.ippanel.com/v1/api/send",
      {
        sending_type: "pattern",
        from_number: cfg.sender,
        code: cfg.pattern,
        recipients: [`0${phone.slice(3)}`],
        params: { [cfg.param]: code },
      },
      { Authorization: cfg.apiKey }
    )
    if (reply?.meta?.status !== true) {
      throw new Error("OTP not accepted")
    }
  } catch {
    cfg.store.finish(phone, generation, false)
    throw new SmsDeliveryError()
  }
  if (!cfg.store.finish(phone, generation, true))
    throw new Error("OTP expired or superseded")
  return { retryAfter }
}

const encode = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url")

async function exchange(phone: string, cfg: ReturnType<typeof config>) {
  const iat = Math.floor(Date.now() / 1000)
  const payload = {
    iss: "ainura-otp",
    aud: "medusa:customer:phone-otp",
    sub: phone,
    iat,
    exp: iat + 45,
    jti: randomUUID(),
  }
  const input = `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}`
  const assertion = `${input}.${createHmac("sha256", cfg.secret).update(input).digest("base64url")}`
  const reply = await post(new URL("/auth/customer/phone-otp", cfg.backend), {
    assertion,
  })
  // Trust the configured Medusa origin for issuance, not data supplied by the client.
  // Never forward its intermediate registration, MFA or identity-verification tokens.
  const token = reply?.token
  if (
    typeof token !== "string" ||
    Object.keys(reply).length !== 1 ||
    !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)
  ) {
    throw new Error("No final customer token")
  }
  const claims = JSON.parse(
    Buffer.from(token.split(".")[1], "base64url").toString()
  )
  if (
    claims?.actor_type !== "customer" ||
    typeof claims.actor_id !== "string" ||
    !claims.actor_id.trim() ||
    typeof claims.auth_identity_id !== "string" ||
    !claims.auth_identity_id.trim()
  )
    throw new Error("Unlinked token")
  return { token }
}

function json(body: object, status = 200, headers?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  })
}

async function input(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
      "application/json" ||
    !request.body
  )
    return null
  const reader = request.body.getReader()
  const bytes: Uint8Array[] = []
  let length = 0
  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.length
      if (length > 1024) {
        await reader.cancel()
        return null
      }
      bytes.push(value)
    }
    return JSON.parse(Buffer.concat(bytes).toString())
  } catch {
    return null
  } finally {
    reader.releaseLock()
  }
}

export async function otp(request: Request, action: "request" | "verify") {
  try {
    const body = await input(request)
    const phone =
      typeof body?.phone === "string" && normalizeIranMobile(body.phone)
    if (!phone) return json({ message: "شماره موبایل معتبر وارد کنید." }, 400)
    const code = typeof body.code === "string" ? normalizeDigits(body.code) : ""
    if (action === "verify" && !/^\d{6}$/.test(code))
      return json({ message: "کد باید شش رقم باشد." }, 400)
    const cfg = config()
    const ip = trustedIp(request.headers)
    if (action === "request") return json(await send(phone, ip, cfg))
    if (!cfg.store.consume(phone, ip, code))
      return json({ message: "کد اشتباه است یا منقضی شده است." }, 401)
    return json(await exchange(phone, cfg))
  } catch (error) {
    if (error instanceof SmsDeliveryError)
      return json(
        {
          message:
            "سامانهٔ پیامکی ارسال کد را تأیید نکرد. یک دقیقهٔ دیگر دوباره تلاش کنید.",
        },
        503,
        { "Retry-After": String(retryAfter) }
      )
    if (error instanceof OtpLimit)
      return json({ message: "لطفاً کمی بعد دوباره تلاش کنید." }, 429, {
        "Retry-After": String(error.retryAfter),
      })
    return json({ message: "سرویس ورود موقتاً در دسترس نیست." }, 503)
  }
}
