"use client"

import Link from "next/link"
import { useRef } from "react"
import { useCommerce } from "@/lib/commerce"
import { formatPrice, toPersian } from "@/lib/format"
import type { CatalogProduct } from "@/lib/medusa"
import { Icon, Media, number } from "../layout/ui"
import { variantDiscount } from "./catalog"

export function WishlistButton({ product }: { product: CatalogProduct }) {
  const { wishlist, toggleWishlist } = useCommerce()
  const saved = wishlist.some((item) => item.id === product.id)
  return (
    <button
      className="store-icon store-wishlist"
      type="button"
      aria-label={saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      aria-pressed={saved}
      onClick={() => {
        void toggleWishlist(product)
      }}
    >
      <Icon name="heart" />
    </button>
  )
}

export function ProductCard({
  product,
  variants = product.variants,
  badge,
  highlightDiscount,
}: {
  product: CatalogProduct
  variants?: CatalogProduct["variants"]
  badge?: string
  highlightDiscount?: boolean
}) {
  const ordered = [...variants].sort((a, b) => a.price - b.price)
  const variant =
    ordered.find(
      (item) => item.available && (!highlightDiscount || variantDiscount(item))
    ) ?? ordered[0]
  const discount = variant ? variantDiscount(variant) : 0
  const sizes = [
    ...new Set(
      variants
        .filter((option) => option.available)
        .flatMap(({ size }) => (size ? [size] : []))
    ),
  ]

  return (
    <article className="store-product-card">
      <div className="store-card-frame">
        <Link
          href={`/products/${encodeURIComponent(product.handle)}`}
          aria-label={product.title}
        >
          <Media src={product.images[0]} alt="" />
        </Link>
        <WishlistButton product={product} />
        {(discount > 0 || badge) && (
          <span
            className={`store-card-badge${discount ? " store-sale-badge" : ""}`}
          >
            {discount ? `٪${number(discount)}` : badge}
          </span>
        )}
        {sizes.length > 0 && (
          <div className="store-quick-sizes">
            <span>سایزهای موجود</span>
            <span>{sizes.map(toPersian).join(" · ")}</span>
          </div>
        )}
      </div>
      <div className="store-card-info">
        {product.brand && (
          <Link
            className="store-card-brand"
            href={`/brands/${encodeURIComponent(product.brand.handle)}`}
          >
            {product.brand.name}
          </Link>
        )}
        <h3>
          <Link href={`/products/${encodeURIComponent(product.handle)}`}>
            {product.title}
          </Link>
        </h3>
        <div className="store-card-price">
          {variant?.available && discount > 0 && (
            <del>{formatPrice(variant.originalPrice, product.currency)}</del>
          )}
          {variant?.available ? (
            <strong>{formatPrice(variant.price, product.currency)}</strong>
          ) : (
            <span>ناموجود</span>
          )}
        </div>
      </div>
    </article>
  )
}

export function ProductRail({
  title,
  products,
  href,
  badge,
  highlightDiscount,
}: {
  title: string
  products: CatalogProduct[]
  href?: string
  badge?: string
  highlightDiscount?: boolean
}) {
  const rail = useRef<HTMLDivElement>(null)
  if (!products.length) return null
  const scroll = (direction: number) =>
    rail.current?.scrollBy({
      left: direction * rail.current.clientWidth * 0.85,
    })
  return (
    <section className="store-section">
      <div className="store-section-heading">
        <h2>{title}</h2>
        <div className="store-rail-actions">
          {href && (
            <Link href={href}>
              مشاهده همه <Icon name="arrow" size={16} />
            </Link>
          )}
          <button
            className="store-icon store-outline"
            aria-label={`قبلی: ${title}`}
            onClick={() => scroll(1)}
          >
            <Icon name="right" size={17} />
          </button>
          <button
            className="store-icon store-outline"
            aria-label={`بعدی: ${title}`}
            onClick={() => scroll(-1)}
          >
            <Icon name="left" size={17} />
          </button>
        </div>
      </div>
      <div className="store-product-rail" ref={rail}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            badge={badge}
            highlightDiscount={highlightDiscount}
          />
        ))}
      </div>
    </section>
  )
}
