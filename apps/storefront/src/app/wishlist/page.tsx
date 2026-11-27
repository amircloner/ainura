"use client"

import Link from "next/link"
import { WishlistLine } from "@/components/commerce/wishlist-line"
import { useCommerce } from "@/lib/commerce"

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
