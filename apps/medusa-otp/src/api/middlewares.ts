import {
  defineMiddlewares, getAuthContextFromJwtToken,
  type AuthContext, type MedusaNextFunction, type MedusaRequest, type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// The allowlist controls new logins, not previously issued JWTs or cookies.
// Reject legacy customer sessions on both store and session/refresh endpoints.
function rejectLegacyCustomer(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const legacy = (ctx?: AuthContext | null) => ctx?.actor_type === "customer" && ctx.auth_provider !== "phone-otp"
  const { http } = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE).projectConfig
  if (legacy(req.session?.auth_context) || legacy(getAuthContextFromJwtToken(
    req.headers.authorization, http.jwtSecret!, ["bearer"], ["customer"],
    http.jwtPublicKey, http.jwtVerifyOptions ?? http.jwtOptions,
  ))) return res.status(401).json({ message: "Phone verification required" })
  next()
}

export default defineMiddlewares({ routes: [
  { matcher: "/store", middlewares: [rejectLegacyCustomer] },
  { matcher: "/auth", middlewares: [rejectLegacyCustomer] },
  { matcher: "/auth/customer/phone-otp", middlewares: [
    (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
      res.setHeader("Cache-Control", "no-store")
      if (req.method !== "POST" || !req.is("application/json") || Object.keys(req.query).length) {
        return res.status(400).json({ message: "Expected JSON POST" })
      }
      next()
    },
  ] },
] })
