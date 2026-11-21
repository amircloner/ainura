"use client"

import Link from "next/link"
import { useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { formatPrice, toPersian } from "@/lib/format"
import type { CatalogProduct } from "@/lib/seed-data"

function WishlistLine({ product }: { product: CatalogProduct }) {
  const { busy, addToCart, toggleWishlist } = useCommerce()
  const variants = product.variants.filter(({ available }) => available)
  const [variantId, setVariant] = useState(variants[0]?.id ?? "")
  const price = variants.find(({ id }) => id === variantId)?.price
  return (
    <article className="commerce-line">
      {product.images[0] && (
        <img src={product.images[0]} alt="" width="76" height="86" />
      )}
      <div className="commerce-stack">
        <Link href={`/products/${product.handle}`}>{product.title}</Link>
        {price !== undefined && (
          <strong>{formatPrice(price, product.currency)}</strong>
        )}
        {!!variants.length && (
          <label>
            رنگ و سایز
            <select
              value={variantId}
              onChange={(event) => setVariant(event.target.value)}
            >
              {variants.map(({ id, color, size }) => (
                <option key={id} value={id}>
                  {[color, toPersian(size)].filter(Boolean).join(" / ") ||
                    "گزینه موجود"}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="commerce-actions">
          <button
            className="commerce-primary"
            disabled={busy || !variantId || price === undefined}
            onClick={async () => {
              try {
                await addToCart(product, variantId)
                await toggleWishlist(product)
              } catch {
                /* provider displays errors */
              }
            }}
          >
            {variants.length ? "انتقال به سبد خرید" : "ناموجود"}
          </button>
          <button disabled={busy} onClick={() => void toggleWishlist(product)}>
            حذف
          </button>
        </div>
      </div>
    </article>
  )
}

export default function WishlistPage() {
  const { ready, wishlist } = useCommerce()
  return (
    <main className="commerce-page">
      <h1>علاقه‌مندی‌ها</h1>
      {!ready ? (
        <p>در حال بارگذاری…</p>
      ) : wishlist.length ? (
        <div className="commerce-stack">
          {wishlist.map((product) => (
            <WishlistLine key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="commerce-panel">
          <p>هنوز محصولی ذخیره نکرده‌اید.</p>
          <Link href="/products">مرور محصولات</Link>
        </div>
      )}
    </main>
  )
}
