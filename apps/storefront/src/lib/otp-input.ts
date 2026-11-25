export { latinDigits as normalizeDigits } from "./format.ts"
import { latinDigits } from "./format.ts"

/** Accept local and international spellings; return one E.164 identity. */
export function normalizeIranMobile(input: string): string | null {
  if (input.length > 40) return null
  const phone = latinDigits(input.trim()).replace(/[ ()-]/g, "")
  const match = /^(?:0|(?:\+|00)?98)?(9\d{9})$/.exec(phone)
  return match ? `+98${match[1]}` : null
}
