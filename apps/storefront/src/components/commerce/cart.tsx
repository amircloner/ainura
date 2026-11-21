"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { formatPrice, toPersian } from "@/lib/format"

export function CommerceNotice() {
  const { notice } = useCommerce()
  return (
    <div className="commerce-notice" aria-live="polite">
      {notice && <span>{notice}</span>}
    </div>
  )
}

export function CartDrawer() {
  const { isCartOpen, closeCart } = useCommerce()
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (isCartOpen && !dialog.current?.open) dialog.current?.showModal()
    if (!isCartOpen && dialog.current?.open) dialog.current.close()
  }, [isCartOpen])
  return (
    <dialog
      ref={dialog}
      className="commerce-drawer"
      aria-labelledby="cart-drawer-title"
      onClose={closeCart}
      onClick={(event) => {
        if (event.target === dialog.current) closeCart()
      }}
    >
      <div className="commerce-drawer-body">
        <div className="commerce-row">
          <h2 id="cart-drawer-title">سبد خرید</h2>
          <button onClick={closeCart}>بستن</button>
        </div>
        <CartContents drawer />
      </div>
    </dialog>
  )
}

export function CartContents({ drawer = false }: { drawer?: boolean }) {
  const {
    cart,
    busy,
    ready,
    subtotal,
    currency,
    discount,
    shipping,
    total,
    notice,
    isDemoCart,
    closeCart,
    updateQuantity,
    applyCoupon,
  } = useCommerce()
  const [code, setCode] = useState("")
  if (!ready) return <p>در حال بارگذاری سبد…</p>
  if (!cart.length)
    return (
      <div className="commerce-panel">
        <p>سبد خرید شما خالی است.</p>
        <Link href="/products" onClick={closeCart}>
          مشاهده محصولات
        </Link>
      </div>
    )
  const format = (amount: number) => formatPrice(amount, currency)
  const threshold = isDemoCart
    ? 2_500_000
    : Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD)
  return (
    <div className={drawer ? "commerce-stack" : "commerce-grid"}>
      <div className="commerce-stack">
        {isDemoCart && (
          <p className="commerce-tag">سبد آزمایشی؛ خرید واقعی ثبت نمی‌شود.</p>
        )}
        {cart.map(({ id, product, variant, quantity }) => (
          <article key={id} className="commerce-line">
            {product.images[0] && (
              <img src={product.images[0]} width="76" height="86" alt="" />
            )}
            <div>
              <Link
                href={
                  product.handle ? `/products/${product.handle}` : "/products"
                }
                onClick={closeCart}
              >
                {product.title}
              </Link>
              <p>
                {[variant.color, toPersian(variant.size)]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              <strong>{format(variant.price * quantity)}</strong>
              <div className="commerce-quantity" aria-label="تعداد">
                <button
                  type="button"
                  disabled={busy}
                  aria-label={`افزایش تعداد ${product.title}`}
                  onClick={() =>
                    void updateQuantity(id, quantity + 1).catch(() => {})
                  }
                >
                  +
                </button>
                <span>{toPersian(quantity)}</span>
                <button
                  type="button"
                  disabled={busy || quantity === 1}
                  aria-label={`کاهش تعداد ${product.title}`}
                  onClick={() =>
                    void updateQuantity(id, quantity - 1).catch(() => {})
                  }
                >
                  −
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void updateQuantity(id, 0).catch(() => {})}
                >
                  حذف
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <aside className="commerce-panel commerce-stack">
        {threshold > 0 && (
          <label className="commerce-stack">
            {subtotal >= threshold
              ? "به حد ارسال رایگان رسیدید."
              : `${format(threshold - subtotal)} تا ارسال رایگان`}
            <progress value={Math.min(subtotal, threshold)} max={threshold} />
          </label>
        )}
        {!drawer && (
          <form
            className="commerce-stack"
            onSubmit={(event) => {
              event.preventDefault()
              void applyCoupon(code).catch(() => {})
            }}
          >
            <label>
              کد تخفیف
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                dir="ltr"
                placeholder={isDemoCart ? "AINURA10" : undefined}
                required
              />
            </label>
            <button disabled={busy}>اعمال کد</button>
          </form>
        )}
        <div className="commerce-row">
          <span>جمع کالاها</span>
          <span>{format(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="commerce-row">
            <span>تخفیف</span>
            <span>{format(discount)}</span>
          </div>
        )}
        {shipping > 0 && (
          <div className="commerce-row">
            <span>ارسال</span>
            <span>{format(shipping)}</span>
          </div>
        )}
        <div className="commerce-row commerce-total">
          <strong>قابل پرداخت</strong>
          <strong>{format(total)}</strong>
        </div>
        {drawer && notice && <p role="status">{notice}</p>}
        <Link
          className="commerce-primary"
          href={drawer ? "/cart" : "/checkout"}
          onClick={closeCart}
        >
          {drawer ? "مشاهده سبد خرید" : "ادامه ثبت سفارش"}
        </Link>
      </aside>
    </div>
  )
}
