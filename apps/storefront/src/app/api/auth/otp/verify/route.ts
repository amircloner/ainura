import { otp } from "../../../../../lib/server/otp.ts"

export const runtime = "nodejs"
export const POST = (request: Request) => otp(request, "verify")
