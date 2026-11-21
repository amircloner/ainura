"use client"

import Link from "next/link"
import { useRef } from "react"
import { useCommerce } from "@/lib/commerce"
import type { CatalogProduct } from "@/lib/medusa"
import { Icon, number } from "../layout/ui"
import { variantDiscount } from "./catalog"

export function productHref(product: CatalogProduct) {
  return `/product/${encodeURIComponent(product.handle)}`
}

export function WishlistButton({
  product,
  className = "ds-card-fav",
}: {
  product: CatalogProduct
  className?: string
}) {
  const { wishlist, toggleWishlist } = useCommerce()
  const saved = wishlist.some((item) => item.id === product.id)
  return (
    <button
      className={className}
      type="button"
      aria-label={saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      aria-pressed={saved}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void toggleWishlist(product)
      }}
    >
      <Icon name="heart" size={18} />
    </button>
  )
}

export function ProductCard({
  product,
  variants = product.variants,
  highlightDiscount,
  fluid = false,
}: {
  product: CatalogProduct
  variants?: CatalogProduct["variants"]
  badge?: string
  highlightDiscount?: boolean
  fluid?: boolean
}) {
  const ordered = [...variants].sort((a, b) => a.price - b.price)
  const variant =
    ordered.find(
      (item) => item.available && (!highlightDiscount || variantDiscount(item))
    ) ?? ordered[0]
  const discount = variant ? variantDiscount(variant) : 0
  const isIrr = product.currency?.toLowerCase() === "irr"
  const toman = (amount: number) =>
    number(Math.round(isIrr ? amount / 10 : amount))
  const href = productHref(product)

  return (
    <article className={`ds-card${fluid ? " ds-card-grid-item" : ""}`}>
      <div className="ds-card-media">
        <Link href={href} aria-label={product.title}>
          {product.images[0] && (
            <img src={product.images[0]} alt={product.title} loading="lazy" />
          )}
        </Link>
        <WishlistButton product={product} />
      </div>

      <Link href={href} className="ds-card-body">
        <div className="ds-card-titles">
          <p className="ds-card-brand">{product.brand?.name || "دیجی‌استایل"}</p>
          <p className="ds-card-name">{product.title}</p>
        </div>

        <div className="ds-card-prices">
          {variant?.available ? (
            <>
              {discount > 0 && (
                <div className="ds-card-old-row">
                  <span className="ds-card-old-price">
                    {toman(variant.originalPrice)}
                  </span>
                  <span className="ds-discount-badge">٪{number(discount)}</span>
                </div>
              )}
              <div className="ds-card-final-row">
                <span className="ds-card-final-price">
                  {toman(variant.price)}
                </span>
                <span className="ds-toman">تومان</span>
              </div>
            </>
          ) : (
            <span className="ds-card-oos">اتمام موجودی</span>
          )}
        </div>
      </Link>
    </article>
  )
}

export function SeeAllCard({
  href,
  image,
}: {
  href: string
  image?: string
}) {
  return (
    <Link href={href} className="ds-see-all-card">
      {image && <img src={image} alt="" loading="lazy" />}
      <div className="ds-see-all-overlay">
        <span>همه محصول‌ها</span>
        <Icon name="arrow" size={16} />
      </div>
    </Link>
  )
}

export function ProductRail({
  title,
  products,
  href,
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
  const visible = href && products.length > 8 ? products.slice(0, 8) : products
  const seeAllImg = href ? products[8]?.images[0] ?? products[0]?.images[0] : undefined
  const scroll = (dir: number) =>
    rail.current?.scrollBy({ left: dir * 680, behavior: "smooth" })

  return (
    <section className="ds-carousel-section">
      <div className="ds-carousel-head">
        <h2>{title}</h2>
        <hr className="ds-carousel-hr" />
        {href && (
          <Link href={href} className="ds-see-all-link">
            <span>مشاهده همه</span>
            <span className="ds-see-all-icon">
              <Icon name="left" size={14} />
            </span>
          </Link>
        )}
      </div>

      <div className="ds-rail-wrap">
        <button
          type="button"
          className="ds-fab-arrow ds-fab-prev"
          aria-label={`قبلی: ${title}`}
          onClick={() => scroll(1)}
        >
          <Icon name="right" size={16} />
        </button>
        <div className="ds-rail" ref={rail}>
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlightDiscount={highlightDiscount}
            />
          ))}
          {href && seeAllImg && <SeeAllCard href={href} image={seeAllImg} />}
        </div>
        <button
          type="button"
          className="ds-fab-arrow ds-fab-next"
          aria-label={`بعدی: ${title}`}
          onClick={() => scroll(-1)}
        >
          <Icon name="left" size={16} />
        </button>
      </div>
    </section>
  )
}
