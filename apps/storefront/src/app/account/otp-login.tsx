"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { normalizeDigits, normalizeIranMobile } from "@/lib/otp-input"
import styles from "./otp-login.module.css"

export function OtpLogin() {
  const { completeOtpLogin } = useCommerce()
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [sentTo, setSentTo] = useState("")
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [retryAt, setRetryAt] = useState(0)
  const [limitedPhone, setLimitedPhone] = useState("")
  const [seconds, setSeconds] = useState(0)
  const field = useRef<HTMLInputElement>(null)
  const lock = useRef(false)
  const waiting = seconds > 0 && limitedPhone === normalizeIranMobile(phone)

  useEffect(() => {
    if (sentTo) field.current?.focus()
  }, [sentTo])
  useEffect(() => {
    if (!retryAt) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))
      setSeconds(left)
      if (!left) setRetryAt(0)
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [retryAt])

  async function submit(verify: boolean) {
    if (lock.current) return
    const mobile = normalizeIranMobile(phone)
    if (!mobile || (verify && !/^\d{6}$/.test(code))) {
      setError(
        verify
          ? "کد ۶ رقمی پیامک را وارد کنید."
          : "شمارهٔ موبایل ایران را کامل وارد کنید."
      )
      field.current?.focus()
      return
    }
    lock.current = true
    setPending(true)
    setError("")
    try {
      const res = await fetch(
        `/api/auth/otp/${verify ? "verify" : "request"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            verify ? { phone: sentTo, code } : { phone: mobile }
          ),
        }
      )
      const data = await res.json()
      const delay = Number(res.headers.get("Retry-After") || data.retryAfter)
      if (delay > 0) {
        setLimitedPhone(mobile)
        setRetryAt(Date.now() + delay * 1000)
      }
      if (!res.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "درخواست انجام نشد. دوباره تلاش کنید."
        )
        return
      }
      if (!verify) {
        setSentTo(mobile)
        setCode("")
        field.current?.focus()
        return
      }
      if (typeof data.token !== "string" || !data.token) throw new Error()
      await completeOtpLogin(data.token)
      const next = new URLSearchParams(window.location.search).get("next")
      if (next && /^\/products?\/[\w%-]+(?:#reviews)?$/.test(next))
        router.replace(next)
    } catch {
      setError("ارتباط با سرویس ورود برقرار نشد. دوباره تلاش کنید.")
    } finally {
      lock.current = false
      setPending(false)
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card} aria-labelledby="login-title">
        <div className={styles.heading}>
          <img
            src="/digistyle/logo.svg"
            width="126"
            height="22"
            alt="دیجی‌استایل"
          />
          <span>حساب کاربری</span>
        </div>
        <div className={styles.progress} aria-hidden="true">
          <i />
          <i data-active={!!sentTo} />
        </div>
        <h1 id="login-title">
          {sentTo ? "کد تأیید را وارد کنید" : "ورود یا ثبت‌نام"}
        </h1>
        <p className={styles.hint}>
          {sentTo ? (
            <>
              کد ۶ رقمی به شمارهٔ <bdi>{`0${sentTo.slice(3)}`}</bdi> پیامک شد و
              تا ۳ دقیقه اعتبار دارد.
            </>
          ) : (
            "برای ورود به حساب یا ساخت حساب جدید، شمارهٔ موبایل خود را وارد کنید."
          )}
        </p>
        {sentTo && (
          <button
            className={styles.link}
            disabled={pending}
            onClick={() => {
              setSentTo("")
              setError("")
              setCode("")
            }}
          >
            ویرایش شماره
          </button>
        )}
        <form
          noValidate
          aria-busy={pending}
          onSubmit={(e) => {
            e.preventDefault()
            void submit(!!sentTo)
          }}
        >
          <label htmlFor="otp-field">
            {sentTo ? "کد تأیید" : "شمارهٔ موبایل"}
          </label>
          <input
            key={sentTo ? "code" : "phone"}
            ref={field}
            id="otp-field"
            dir="ltr"
            type={sentTo ? "text" : "tel"}
            inputMode={sentTo ? "numeric" : "tel"}
            autoComplete={sentTo ? "one-time-code" : "tel"}
            placeholder={sentTo ? "– – – – – –" : "0912 345 6789"}
            maxLength={sentTo ? 6 : 24}
            readOnly={pending}
            required
            aria-invalid={!!error}
            aria-describedby={error ? "otp-error" : undefined}
            value={sentTo ? code : phone}
            onChange={(e) => {
              setError("")
              if (sentTo)
                setCode(normalizeDigits(e.target.value).replace(/\D/g, ""))
              else setPhone(e.target.value)
            }}
          />
          {error && (
            <p className={styles.error} id="otp-error" role="alert">
              {error}
            </p>
          )}
          <button
            className={styles.submit}
            disabled={pending || (!sentTo && waiting)}
          >
            {pending
              ? "لطفاً صبر کنید…"
              : sentTo
                ? "تأیید و ورود"
                : "دریافت کد پیامکی"}
          </button>
          {waiting && (
            <p className={styles.countdown}>
              ارسال مجدد پس از {seconds.toLocaleString("fa-IR")} ثانیه
            </p>
          )}
          {sentTo && !waiting && (
            <button
              type="button"
              className={styles.link}
              disabled={pending}
              onClick={() => void submit(false)}
            >
              ارسال مجدد کد
            </button>
          )}
        </form>
        <p className={styles.note}>کد ورود را در اختیار دیگران قرار ندهید.</p>
      </section>
    </main>
  )
}
