import { randomUUID } from "node:crypto"
import jwt from "jsonwebtoken"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"

// Do not let a manually invoked suite use the developer's default PostgreSQL.
if (process.env.OTP_DISPOSABLE_TEST !== "1" || process.env.DB_USERNAME !== "otp_disposable" ||
    process.env.DB_HOST !== "localhost" || !process.env.DB_PORT || process.env.DB_PORT === "5432") throw Error("Use test.sh")

const secret = process.env.OTP_ASSERTION_SECRET!
const bearerSecret = process.env.JWT_SECRET!
const phone = "+989123456789"
const claims = () => ({ iss: "ainura-otp", aud: "medusa:customer:phone-otp", sub: phone,
  jti: randomUUID(), exp: Math.floor(Date.now() / 1000) + 45 })
jest.setTimeout(120000)
medusaIntegrationTestRunner({
  cwd: __dirname,
  testSuite: ({ api, getContainer }) => {
    it("issues usable customer tokens only after a single-use assertion", async () => {
      const endpoint = "/auth/customer/phone-otp"
      const request = (assertion: string) => api.post(endpoint, { assertion }, { validateStatus: () => true })
      const sign = (extra = {}) => jwt.sign({ ...claims(), ...extra }, secret)
      const status = async (path: string, body = {}) => (await api.post(path, body, { validateStatus: () => true })).status
      const customers = getContainer().resolve(Modules.CUSTOMER)
      const [legacy] = await customers.createCustomers([{ phone, email: "legacy@example.invalid", has_account: true }])
      for (const invalid of ["", sign({ exp: 1 }), sign({ aud: "admin" }), sign({ sub: "09123456789" }),
        sign({ iss: "untrusted" }), sign({ exp: Math.floor(Date.now() / 1000) + 61 }), jwt.sign(claims(), bearerSecret)]) {
        expect((await request(invalid)).status).toBe(401)
      }
      expect(await status(endpoint + "/register")).toBe(401)
      expect(await status("/auth/customer/emailpass")).toBe(400)
      expect(await status("/auth/customer/emailpass/register")).toBe(400)
      expect(await status("/auth/user/phone-otp")).toBe(400)
      expect(await status("/auth/user/emailpass")).toBe(401) // provider reached, not disallowed
      const admin = { email: "admin@example.invalid", password: randomUUID() }
      const { authIdentity } = await getContainer().resolve(Modules.AUTH).register("emailpass", { body: admin })
      const user = await getContainer().resolve(Modules.USER).createUsers({ email: admin.email })
      await getContainer().resolve(Modules.AUTH).updateAuthIdentities({ id: authIdentity!.id, app_metadata: { user_id: user.id } })
      const login = await api.post("/auth/user/emailpass", admin)
      expect((jwt.verify(login.data.token, bearerSecret) as jwt.JwtPayload).actor_id).toBe(user.id)
      expect(await status("/auth/customer/emailpass", admin)).toBe(400)

      const assertion = sign()
      const raced = await Promise.all([request(assertion), request(assertion)])
      expect(raced.map(r => r.status).sort()).toEqual([200, 401])
      const token = raced.find(r => r.status === 200).data.token
      const identity = jwt.verify(token, bearerSecret) as jwt.JwtPayload
      expect(identity.actor_type).toBe("customer")
      expect(identity.auth_provider).toBe("phone-otp")
      expect(identity.actor_id).toBeTruthy()
      expect(identity.actor_id).not.toBe(legacy.id)
      expect((await request(assertion)).status).toBe(401)

      const key = await getContainer().resolve(Modules.API_KEY).createApiKeys({ title: "test", type: "publishable", created_by: "test" })
      const cfg = { headers: { Authorization: `Bearer ${token}`, "x-publishable-api-key": key.token } }
      const me = await api.get("/store/customers/me", cfg)
      expect(me.data.customer.id).toBe(identity.actor_id)
      await customers.updateCustomers(identity.actor_id, { phone: "+989111111111", email: "changed@example.invalid" })
      const again = await request(sign())
      expect(again.status).toBe(200)
      expect((jwt.verify(again.data.token, bearerSecret) as jwt.JwtPayload).actor_id).toBe(identity.actor_id)
      expect((await request(assertion)).status).toBe(401)
      const session = await api.post("/auth/session", {}, cfg)
      expect(session.status).toBe(200)
      const cookie = session.headers["set-cookie"][0].split(";")[0]
      const withCookie = await api.get("/store/customers/me", { headers: { Cookie: cookie, "x-publishable-api-key": key.token } })
      expect(withCookie.data.customer.id).toBe(identity.actor_id)

      const old = jwt.sign({ actor_type: "customer", auth_provider: "emailpass", actor_id: legacy.id, auth_identity_id: "old" }, bearerSecret)
      const legacyCfg = { headers: { ...cfg.headers, Authorization: `Bearer ${old}` }, validateStatus: () => true }
      expect((await api.get("/store/customers/me", legacyCfg)).status).toBe(401)
      expect((await api.post("/auth/token/refresh", {}, legacyCfg)).status).toBe(401)
    })
  },
})
