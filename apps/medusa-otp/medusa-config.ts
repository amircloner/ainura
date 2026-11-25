// Disposable test app, not a replacement for the external app's config.
import { defineConfig } from "@medusajs/framework/utils"
import { otpAuthModule, otpHttp } from "./src/phone-otp-config"

if (process.env.OTP_DISPOSABLE_TEST !== "1") throw new Error("Test app only")
export default defineConfig({
  projectConfig: { http: {
    ...otpHttp, storeCors: "", adminCors: "", authCors: "",
    jwtSecret: process.env.JWT_SECRET, cookieSecret: process.env.COOKIE_SECRET,
  } },
  modules: [otpAuthModule()],
})
