"use client"

import type { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { useEffect, useState } from "react"
import { OtpLogin } from "./otp-login"
import { AddressFields, readAddress } from "@/components/commerce/address"
import { commerceError, useCommerce } from "@/lib/commerce"
import { formatPrice, sdk, toPersian } from "@/lib/medusa"

export default function AccountPage() {
  const { ready, customer, busy, logout, changeAddress } = useCommerce()
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
  if (!customer) return <OtpLogin />

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
          : customer.phone || "خوش آمدید."}
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
