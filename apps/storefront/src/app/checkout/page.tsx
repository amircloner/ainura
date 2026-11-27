"use client"

import Link from "next/link"
import { useState } from "react"
import { AddressFields, readAddress } from "@/components/commerce/address"
import {
  commerceError,
  customerContactEmail,
  useCommerce,
} from "@/lib/commerce"
import { formatPrice, toPersian } from "@/lib/format"

export default function CheckoutPage() {
  const {
    ready,
    cart,
    customer,
    busy,
    isDemoCart,
    currency,
    total,
    prepareCheckout,
    chooseShipping,
    completeCheckout,
  } = useCommerce()
  const [step, setStep] = useState(0)
  const [shipping, setShipping] = useState<
    Awaited<ReturnType<typeof prepareCheckout>>
  >([])
  const [payments, setPayments] = useState<
    Awaited<ReturnType<typeof chooseShipping>>
  >([])
  const [selection, setSelection] = useState("")
  const [shippingCost, setShippingCost] = useState(0)
  const [confirmation, setConfirmation] = useState("")
  const [demoOrder, setDemoOrder] = useState(false)
  const [error, setError] = useState("")
  const [selectedAddressId, setAddressId] = useState<string | null>(null)
  const addressId =
    selectedAddressId ??
    customer?.addresses?.find((entry) => entry.is_default_shipping)?.id ??
    ""
  const [address, setAddress] = useState<ReturnType<typeof readAddress>>()
  const [email, setEmail] = useState("")

  async function submit(action: () => Promise<void>) {
    setError("")
    try {
      await action()
    } catch (error) {
      setError(commerceError(error))
    }
  }

  if (confirmation)
    return (
      <main className="commerce-page">
        <h1>{demoOrder ? "سفارش آزمایشی تکمیل شد" : "سفارش شما ثبت شد"}</h1>
        <p>
          کد پیگیری: <bdi>{toPersian(confirmation)}</bdi>
        </p>
        {demoOrder && <p>پرداختی انجام نشد و کالایی ارسال نخواهد شد.</p>}
        <Link href="/products">بازگشت به فروشگاه</Link>
      </main>
    )
  if (!ready || !cart.length)
    return (
      <main className="commerce-page">
        <h1>تسویه حساب</h1>
        {ready ? (
          <Link href="/products">سبد خالی است؛ مشاهده محصولات</Link>
        ) : (
          <p>در حال بارگذاری…</p>
        )}
      </main>
    )

  return (
    <main className="commerce-page">
      <h1>تسویه حساب</h1>
      {isDemoCart && (
        <p className="commerce-tag">
          حالت آزمایشی. از اطلاعات نمونه استفاده کنید؛ فرم ذخیره یا ارسال
          نمی‌شود.
        </p>
      )}
      <ol className="commerce-steps">
        {["نشانی", "روش ارسال", "پرداخت"].map((label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined}>
            {label}
          </li>
        ))}
      </ol>
      <div className="commerce-grid">
        <section className="commerce-panel">
          {step === 0 && (
            <form
              className="commerce-stack"
              onSubmit={(event) => {
                event.preventDefault()
                const data = new FormData(event.currentTarget)
                void submit(async () => {
                  const nextEmail = String(data.get("email")).trim()
                  const nextAddress = readAddress(data)
                  setEmail(nextEmail)
                  setAddress(nextAddress)
                  const options = await prepareCheckout(nextEmail, nextAddress)
                  if (!options.length)
                    throw new Error("برای این نشانی روش ارسال در دسترس نیست.")
                  setShipping(options)
                  setSelection(options[0].id)
                  setStep(1)
                })
              }}
            >
              <h2>نشانی تحویل</h2>
              <label>
                ایمیل
                <input
                  name="email"
                  type="email"
                  dir="ltr"
                  key={customer?.id}
                  defaultValue={email || customerContactEmail(customer) || ""}
                  required
                />
              </label>
              {!!customer?.addresses?.length && (
                <label>
                  نشانی‌های ذخیره‌شده
                  <select
                    value={addressId}
                    onChange={(event) => setAddressId(event.target.value)}
                  >
                    <option value="">نشانی جدید</option>
                    {customer.addresses.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.city}، {entry.address_1}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <AddressFields
                key={addressId}
                address={
                  customer?.addresses?.find(({ id }) => id === addressId) ??
                  address ??
                  customer ??
                  undefined
                }
              />
              <button className="commerce-primary" disabled={busy}>
                انتخاب روش ارسال
              </button>
            </form>
          )}
          {step === 1 && (
            <form
              className="commerce-stack"
              onSubmit={(event) => {
                event.preventDefault()
                void submit(async () => {
                  const options = await chooseShipping(selection)
                  if (!options.length)
                    throw new Error(
                      "روش پرداخت سازگار برای این منطقه فعال نیست."
                    )
                  setShippingCost(
                    shipping.find(({ id }) => id === selection)?.amount ?? 0
                  )
                  setPayments(options)
                  setSelection(options[0].id)
                  setStep(2)
                })
              }}
            >
              <h2>روش ارسال</h2>
              {shipping.map(({ id, name, amount }) => (
                <label key={id} className="commerce-option">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selection === id}
                    onChange={() => setSelection(id)}
                  />{" "}
                  {name}{" "}
                  {amount == null ? "" : `(${formatPrice(amount, currency)})`}
                </label>
              ))}
              <button className="commerce-primary" disabled={busy}>
                انتخاب روش پرداخت
              </button>
              <button type="button" onClick={() => setStep(0)} disabled={busy}>
                ویرایش نشانی
              </button>
            </form>
          )}
          {step === 2 && (
            <form
              className="commerce-stack"
              onSubmit={(event) => {
                event.preventDefault()
                void submit(async () => {
                  setDemoOrder(isDemoCart)
                  setConfirmation(await completeCheckout(selection))
                })
              }}
            >
              <h2>روش پرداخت</h2>
              {payments.map(({ id, name }) => (
                <label key={id} className="commerce-option">
                  <input
                    type="radio"
                    name="payment"
                    checked={selection === id}
                    onChange={() => setSelection(id)}
                  />
                  {name}
                </label>
              ))}
              <button className="commerce-primary" disabled={busy}>
                {isDemoCart ? "تکمیل خرید آزمایشی" : "تأیید نهایی سفارش"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelection(shipping[0]?.id ?? "")
                  setStep(1)
                }}
                disabled={busy}
              >
                تغییر روش ارسال
              </button>
            </form>
          )}
          {error && (
            <p role="alert" className="commerce-error">
              {error}
            </p>
          )}
        </section>
        <aside className="commerce-panel commerce-stack">
          <h2>خلاصه سفارش</h2>
          <p>
            {toPersian(cart.reduce((count, line) => count + line.quantity, 0))}{" "}
            کالا
          </p>
          <strong>
            {formatPrice(
              total + (isDemoCart && step === 2 ? shippingCost : 0),
              currency
            )}
          </strong>
          <Link href="/cart">ویرایش سبد</Link>
        </aside>
      </div>
    </main>
  )
}
