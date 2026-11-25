import { createHash, createHmac, timingSafeEqual } from "node:crypto"
import type { Knex } from "@medusajs/framework/mikro-orm/knex"
import type {
  AuthenticationInput,
  AuthIdentityProviderService,
  IWorkflowEngineService,
} from "@medusajs/framework/types"
import {
  AbstractAuthModuleProvider,
  ContainerRegistrationKeys,
  MedusaError,
  ModuleProvider,
  Modules,
} from "@medusajs/framework/utils"

const denied = { success: false, error: "Authentication failed" }

function verifiedClaims(assertion: unknown, key: string) {
  if (typeof assertion !== "string" || assertion.length > 2048) return
  const parts = assertion.split(".")
  if (parts.length !== 3 || parts.some((p) => !/^[A-Za-z0-9_-]+$/.test(p))) return
  const [header, payload, signature] = parts
  const mac = createHmac("sha256", key).update(`${header}.${payload}`).digest()
  const supplied = Buffer.from(signature, "base64url")
  if (supplied.length !== mac.length || !timingSafeEqual(mac, supplied)) return
  const h = JSON.parse(Buffer.from(header, "base64url").toString("utf8"))
  if (h.alg !== "HS256" || h.crit !== undefined || h.b64 !== undefined) return
  const p = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
  const now = Math.floor(Date.now() / 1000)
  if (p.iss !== "ainura-otp" || p.aud !== "medusa:customer:phone-otp" ||
      typeof p.sub !== "string" || !/^\+989[0-9]{9}$/.test(p.sub) ||
      typeof p.jti !== "string" || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(p.jti) ||
      !Number.isSafeInteger(p.iat) || !Number.isSafeInteger(p.exp) ||
      p.iat > now || p.exp <= now || p.exp <= p.iat || p.exp - p.iat > 60 ||
      (p.nbf !== undefined && (!Number.isSafeInteger(p.nbf) || p.nbf > now))) return
  return { phone: p.sub as string, id: p.jti as string, expires: p.exp as number }
}

type Dependencies = {
  [ContainerRegistrationKeys.PG_CONNECTION]: Knex
  [Modules.WORKFLOW_ENGINE]: IWorkflowEngineService
}

export class PhoneOtp extends AbstractAuthModuleProvider {
  static identifier = "phone-otp"
  static DISPLAY_NAME = "Phone OTP"

  constructor(private readonly deps: Dependencies) { super() }

  async authenticate(data: AuthenticationInput & { actor_type?: string }, identities: AuthIdentityProviderService) {
    try {
      const key = process.env.OTP_ASSERTION_SECRET
      if (!key || Buffer.byteLength(key) < 32 || data.actor_type !== "customer" ||
          !data.body || Object.keys(data.body).length !== 1) return denied
      const p = verifiedClaims(data.body.assertion, key)
      if (!p) return denied

      // No writes to Medusa tables through SQL. This transaction only holds a
      // process-independent lock while normal auth APIs and the workflow commit.
      const lockKey = createHash("sha256").update(`phone-otp:${p.phone}`).digest().readBigInt64BE()
      return await this.deps[ContainerRegistrationKeys.PG_CONNECTION].transaction(async (tx) => {
        const { rows } = await tx.raw("select pg_try_advisory_xact_lock(?::bigint) as locked", [lockKey.toString()])
        if (!rows[0].locked) return denied
        const lookup = { entity_id: p.phone }
        let identity
        try { identity = await identities.retrieve(lookup) }
        catch (e) {
          if (!(e instanceof MedusaError) || e.type !== MedusaError.Types.NOT_FOUND) throw e
          await identities.create(lookup)
          identity = await identities.retrieve(lookup)
        }
        const provider = identity.provider_identities?.find((i) => i.provider === PhoneOtp.identifier && i.entity_id === p.phone)
        if (!provider || identity.provider_identities?.length !== 1 || identity.app_metadata?.user_id) return denied
        const now = Math.floor(Date.now() / 1000)
        const recent = Object.entries(provider.provider_metadata?.spent ?? {}).filter(([, exp]) => typeof exp === "number" && exp > now)
        if (p.expires <= now || recent.length >= 64 || recent.some(([id]) => id === p.id)) return denied
        // Commit consumption before provisioning. A failure needs a fresh OTP,
        // never a replay. Only unexpired UUIDs are retained, not tokens or codes.
        await identities.update(p.phone, { provider_metadata: { spent: { ...Object.fromEntries(recent), [p.id]: p.expires } } })
        if (!identity.app_metadata?.customer_id) {
          await this.deps[Modules.WORKFLOW_ENGINE].run("create-customer-account", { input: {
            authIdentityId: identity.id,
            customerData: { phone: p.phone, email: `${identity.id}@phone.invalid` },
          } })
          identity = await identities.retrieve(lookup)
        }
        return typeof identity.app_metadata?.customer_id === "string" && identity.app_metadata.customer_id
          ? { success: true, authIdentity: identity } : denied
      })
    } catch { return denied }
  }

  async register() { return denied }
  async update() { return denied }
  async validateCallback() { return denied }
}

export default ModuleProvider(Modules.AUTH, { services: [PhoneOtp] })
