import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export const otpHttp = {
  authMethodsPerActor: { customer: ["phone-otp"], user: ["emailpass"] },
  requireActorAssociation: { "phone-otp": true },
}

export function otpAuthModule() {
  const secret = process.env.OTP_ASSERTION_SECRET
  if (!secret || Buffer.byteLength(secret) < 32 ||
      [process.env.JWT_SECRET, process.env.COOKIE_SECRET].includes(secret)) {
    throw new Error("Set a dedicated, random OTP_ASSERTION_SECRET (at least 32 bytes)")
  }
  return {
    resolve: "@medusajs/medusa/auth" as const,
    dependencies: [ContainerRegistrationKeys.LOGGER, Modules.CACHE, Modules.LOCKING, Modules.WORKFLOW_ENGINE],
    options: { providers: [
      { id: "emailpass", resolve: "@medusajs/medusa/auth-emailpass" },
      { id: "phone-otp", resolve: "./src/modules/phone-otp" },
    ] },
  }
}
