"use client"

import type { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { AddressFields, readAddress } from "@/components/commerce/address"
import { commerceError, useCommerce } from "@/lib/commerce"
import { connected, formatPrice, sdk, toPersian } from "@/lib/medusa"

export default function AccountPage() {
  const { ready, customer, busy, authenticate, logout, changeAddress } =
    useCommerce()
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [register, setRegister] = useState(false)
  const [error, setError] = useState("")
  const [history, setHistory] = useState<{
    customerId: string
    orders?: HttpTypes.StoreOrder[]
  }>({ customerId: "" })
  const [showAddress, setShowAddress] = useState(false)
  const customerId = customer?.id

  useEffect(() => {
    if (!customerId) return
    let active = true
    sdk.store.order
      .list({ limit: 20, order: "-created_at" })
      .then(({ orders }) => {
        if (active) setHistory({ customerId, orders })
      })
      .catch(() => {
        if (active) setHistory({ customerId })
      })
    return () => {
      active = false
    }
  }, [customerId])

  if (!ready)
    return (
      <main className="commerce-page">
        <h1>حساب کاربری</h1>
        <p>در حال بارگذاری…</p>
      </main>
    )
  if (!customer)
    return (
      <main className="commerce-page">
        <h1>حساب کاربری</h1>
        <section className="commerce-panel commerce-stack">
          <p>
            {connected
              ? "برای پیگیری سفارش‌ها و ذخیره نشانی‌های خود وارد شوید."
              : "ورود و ثبت‌نام با اتصال فروشگاه فعال می‌شود. علاقه‌مندی‌های آزمایشی روی همین دستگاه می‌مانند."}
          </p>
          {connected && (
            <div className="commerce-actions">
              <button
                className="commerce-primary"
                onClick={() => {
                  setError("")
                  setRegister(false)
                  dialog.current?.showModal()
                }}
              >
                ورود
              </button>
              <button
                onClick={() => {
                  setError("")
                  setRegister(true)
                  dialog.current?.showModal()
                }}
              >
                ثبت‌نام
              </button>
            </div>
          )}
          <Link href="/wishlist">فهرست علاقه‌مندی‌ها</Link>
        </section>
        <dialog
          ref={dialog}
          className="commerce-dialog"
          aria-labelledby="account-auth-title"
        >
          <div className="commerce-row">
            <h2 id="account-auth-title">
              {register ? "ثبت‌نام در آینورا" : "ورود به آینورا"}
            </h2>
            <button type="button" onClick={() => dialog.current?.close()}>
              بستن
            </button>
          </div>
          <form
            className="commerce-stack"
            key={String(register)}
            onSubmit={async (event) => {
              event.preventDefault()
              setError("")
              const data = new FormData(event.currentTarget)
              try {
                await authenticate(
                  {
                    email: String(data.get("email")).trim(),
                    password: String(data.get("password")),
                    first_name:
                      String(data.get("first_name") ?? "").trim() || undefined,
                    last_name:
                      String(data.get("last_name") ?? "").trim() || undefined,
                  },
                  register
                )
                dialog.current?.close()
                const next = new URLSearchParams(window.location.search).get(
                  "next"
                )
                if (next && /^\/products\/[\w%-]+(?:#reviews)?$/.test(next))
                  router.replace(next)
              } catch (error) {
                setError(commerceError(error))
              }
            }}
          >
            {register && (
              <div className="commerce-fields">
                <label>
                  نام
                  <input name="first_name" autoComplete="given-name" required />
                </label>
                <label>
                  نام خانوادگی
                  <input name="last_name" autoComplete="family-name" required />
                </label>
              </div>
            )}
            <label>
              ایمیل
              <input
                name="email"
                type="email"
                autoComplete="email"
                dir="ltr"
                required
              />
            </label>
            <label>
              رمز عبور
              <input
                name="password"
                type="password"
                autoComplete={register ? "new-password" : "current-password"}
                dir="ltr"
                minLength={register ? 8 : undefined}
                required
              />
            </label>
            {error && (
              <p className="commerce-error" role="alert">
                {error}
              </p>
            )}
            <button className="commerce-primary" disabled={busy}>
              {register ? "ساخت حساب" : "ورود"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError("")
                setRegister(!register)
              }}
            >
              {register ? "قبلاً حساب ساخته‌ام" : "حساب جدید بسازید"}
            </button>
          </form>
        </dialog>
      </main>
    )

  return (
    <main className="commerce-page">
      <div className="commerce-row">
        <h1>حساب کاربری</h1>
        <button onClick={() => void logout().catch(() => {})} disabled={busy}>
          خروج
        </button>
      </div>
      <p>
        {customer.first_name
          ? `${customer.first_name}، خوش آمدید.`
          : customer.email}
      </p>
      <div className="commerce-grid">
        <section className="commerce-panel commerce-stack">
          <h2>سفارش‌های اخیر</h2>
          {history.customerId !== customer.id ? (
            <p>در حال بارگذاری…</p>
          ) : !history.orders ? (
            <p>دریافت سفارش‌ها ممکن نیست.</p>
          ) : history.orders.length ? (
            history.orders.map((order) => (
              <div key={order.id} className="commerce-row commerce-total">
                <span>
                  سفارش <bdi>{toPersian(order.display_id ?? order.id)}</bdi>
                </span>
                <span>{formatPrice(order.total, order.currency_code)}</span>
              </div>
            ))
          ) : (
            <p>هنوز سفارشی ثبت نشده است.</p>
          )}
          <Link href="/wishlist">مشاهده علاقه‌مندی‌ها</Link>
        </section>
        <section className="commerce-panel commerce-stack">
          <h2>نشانی‌های ذخیره‌شده</h2>
          {customer.addresses?.map((address) => (
            <div key={address.id} className="commerce-row commerce-total">
              <span>
                {[address.province, address.city, address.address_1]
                  .filter(Boolean)
                  .join("، ")}
              </span>
              <button
                disabled={busy}
                onClick={() => void changeAddress(address.id).catch(() => {})}
              >
                حذف
              </button>
            </div>
          ))}
          {!customer.addresses?.length && <p>نشانی‌ای ثبت نشده است.</p>}
          <button
            type="button"
            onClick={() => {
              setError("")
              setShowAddress(!showAddress)
            }}
          >
            {showAddress ? "لغو" : "افزودن نشانی"}
          </button>
          {showAddress && (
            <form
              className="commerce-stack"
              onSubmit={async (event) => {
                event.preventDefault()
                try {
                  setError("")
                  await changeAddress(
                    readAddress(new FormData(event.currentTarget))
                  )
                  setShowAddress(false)
                } catch (error) {
                  setError(commerceError(error))
                }
              }}
            >
              <AddressFields address={customer} />
              {error && (
                <p role="alert" className="commerce-error">
                  {error}
                </p>
              )}
              <button className="commerce-primary" disabled={busy}>
                ذخیره نشانی
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
