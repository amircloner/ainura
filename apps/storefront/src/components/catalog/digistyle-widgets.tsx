"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { CatalogProduct } from "@/lib/medusa"
import { Icon } from "../layout/ui"
import { ProductCard, SeeAllCard } from "./product-card"

export function DigistyleHero({
  slides,
}: {
  slides: {
    id: number
    desktopImage: string
    mobileImage: string
    href: string
    alt: string
  }[]
}) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || slides.length < 2) return
    const timer = window.setInterval(
      () => setActive((cur) => (cur + 1) % slides.length),
      5500
    )
    return () => window.clearInterval(timer)
  }, [paused, slides.length])

  const move = (delta: number) =>
    setActive((cur) => (cur + delta + slides.length) % slides.length)

  return (
    <section
      className="ds-hero"
      aria-label="بنرهای صفحه اصلی دیجی‌استایل"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ds-hero-track">
        {slides.map((slide, index) => (
          <Link
            key={slide.id}
            href={slide.href}
            className="ds-hero-slide"
            data-active={active === index ? "true" : "false"}
            aria-hidden={active !== index}
            tabIndex={active === index ? 0 : -1}
          >
            <img
              src={slide.desktopImage}
              alt={slide.alt}
              className="ds-hero-img-desktop"
              loading={index === 0 ? "eager" : "lazy"}
            />
            <img
              src={slide.mobileImage}
              alt={slide.alt}
              className="ds-hero-img-mobile"
              loading={index === 0 ? "eager" : "lazy"}
            />
          </Link>
        ))}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="ds-hero-arrow ds-hero-prev"
              aria-label="اسلاید قبلی"
              onClick={() => move(-1)}
            >
              <Icon name="right" size={18} />
            </button>
            <button
              type="button"
              className="ds-hero-arrow ds-hero-next"
              aria-label="اسلاید بعدی"
              onClick={() => move(1)}
            >
              <Icon name="left" size={18} />
            </button>
            <div className="ds-hero-dots">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className="ds-hero-dot"
                  aria-label={`اسلاید ${index + 1}`}
                  aria-pressed={active === index}
                  onClick={() => setActive(index)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export function CategoryImageRow({
  items,
}: {
  items: { title: string; image: string; href: string }[]
}) {
  const track = useRef<HTMLDivElement>(null)
  const scroll = (dir: number) =>
    track.current?.scrollBy({ left: dir * 480, behavior: "smooth" })

  return (
    <section className="ds-section ds-pad-x ds-cat-row-wrap" aria-label="دسته‌بندی‌ها">
      <button
        type="button"
        className="ds-fab-arrow ds-fab-prev"
        aria-label="قبلی"
        onClick={() => scroll(1)}
      >
        <Icon name="right" size={16} />
      </button>

      <div className="ds-cat-track" ref={track}>
        {items.map((item) => (
          <Link key={item.title} href={item.href} className="ds-cat-item">
            <div className="ds-cat-thumb">
              <img src={item.image} alt={item.title} loading="lazy" />
            </div>
            <span className="ds-cat-title">{item.title}</span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="ds-fab-arrow ds-fab-next"
        aria-label="بعدی"
        onClick={() => scroll(-1)}
      >
        <Icon name="left" size={16} />
      </button>
    </section>
  )
}

export function BrandMarqueeRow({
  title,
  items,
  reverse = false,
}: {
  title?: string
  items: { image: string; href: string }[]
  reverse?: boolean
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const hovered = useRef(false)

  useEffect(() => {
    const el = scroller.current
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return
    let raf = 0
    let last = 0
    const step = (ts: number) => {
      raf = requestAnimationFrame(step)
      const dt = last ? ts - last : 0
      last = ts
      if (hovered.current) return
      const dir = reverse ? 1 : -1
      el.scrollLeft += 0.03 * dt * dir
      const half = el.scrollWidth / 2
      if (Math.abs(el.scrollLeft) >= half) {
        el.scrollLeft = 0
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reverse])

  const doubled = [...items, ...items]

  return (
    <section className="ds-brand-section">
      {title && <h2 className="ds-brand-heading">{title}</h2>}
      <div
        className="ds-brand-scroller"
        ref={scroller}
        onMouseEnter={() => {
          hovered.current = true
        }}
        onMouseLeave={() => {
          hovered.current = false
        }}
      >
        {doubled.map((item, idx) => (
          <Link key={`${item.image}-${idx}`} href={item.href} className="ds-brand-card">
            <img src={item.image} alt="" loading="lazy" />
          </Link>
        ))}
      </div>
    </section>
  )
}

export function AmazingSpecialCarousel({
  title,
  href,
  products,
}: {
  title: string
  href: string
  products: CatalogProduct[]
}) {
  const rail = useRef<HTMLDivElement>(null)
  const [remaining, setRemaining] = useState<number>()

  useEffect(() => {
    const tick = () => {
      const day = 86_400_000
      const tehranOffset = 12_600_000
      setRemaining(
        Math.ceil((day - ((Date.now() + tehranOffset) % day)) / 1000)
      )
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const clock =
    remaining === undefined
      ? "۰۰:۰۰:۰۰"
      : [
          Math.floor(remaining / 3600),
          Math.floor(remaining / 60) % 60,
          remaining % 60,
        ]
          .map((u) => u.toLocaleString("fa-IR", { minimumIntegerDigits: 2 }))
          .join(":")

  if (!products.length) return null
  const visible = products.slice(0, 8)
  const seeAllImg = products[8]?.images[0] ?? products[0]?.images[0]

  return (
    <section className="ds-amazing">
      <img
        src="/digistyle/tag-desktop.svg"
        alt=""
        className="ds-amazing-tag"
        width={27}
        height={55}
      />

      <div className="ds-amazing-header">
        <div className="ds-amazing-title-wrap">
          <h2 className="ds-amazing-title">{title}</h2>
          <div className="ds-amazing-timer">
            <span>تا پایان پیشنهاد:</span>
            <time dir="ltr">{clock}</time>
          </div>
        </div>

        <Link href={href} className="ds-amazing-more">
          <span>مشاهده همه</span>
          <span className="ds-amazing-more-circle">
            <Icon name="left" size={16} />
          </span>
        </Link>
      </div>

      <div className="ds-rail-wrap">
        <div className="ds-rail" ref={rail}>
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              highlightDiscount
            />
          ))}
          {seeAllImg && <SeeAllCard href={href} image={seeAllImg} />}
        </div>
      </div>
    </section>
  )
}

export function TabCarousel({
  title,
  tabs,
}: {
  title: string
  tabs: { title: string; href: string; products: CatalogProduct[] }[]
}) {
  const [active, setActive] = useState(0)
  const rail = useRef<HTMLDivElement>(null)
  const current = tabs[active] ?? tabs[0]
  if (!current) return null

  const visible = current.products.slice(0, 8)
  const seeAllImg =
    current.products[8]?.images[0] ?? current.products[0]?.images[0]
  const scroll = (dir: number) =>
    rail.current?.scrollBy({ left: dir * 680, behavior: "smooth" })

  return (
    <section className="ds-carousel-section">
      <div className="ds-carousel-head">
        <h2>{title}</h2>
        <hr className="ds-carousel-hr" />
        <Link href={current.href} className="ds-see-all-link">
          <span>مشاهده همه</span>
          <span className="ds-see-all-icon">
            <Icon name="left" size={14} />
          </span>
        </Link>
      </div>

      <div className="ds-tabs" role="tablist" aria-label={title}>
        {tabs.map((tab, index) => (
          <button
            key={tab.title}
            type="button"
            role="tab"
            className="ds-tab-btn"
            aria-selected={active === index}
            onClick={() => {
              setActive(index)
              rail.current?.scrollTo({ left: 0 })
            }}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="ds-rail-wrap">
        <button
          type="button"
          className="ds-fab-arrow ds-fab-prev"
          aria-label="قبلی"
          onClick={() => scroll(1)}
        >
          <Icon name="right" size={16} />
        </button>
        <div className="ds-rail" ref={rail}>
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {seeAllImg && <SeeAllCard href={current.href} image={seeAllImg} />}
        </div>
        <button
          type="button"
          className="ds-fab-arrow ds-fab-next"
          aria-label="بعدی"
          onClick={() => scroll(-1)}
        >
          <Icon name="left" size={16} />
        </button>
      </div>
    </section>
  )
}

export function TwoBBanner({
  banners,
}: {
  banners: { desktopImage: string; mobileImage: string; href: string; alt: string }[]
}) {
  return (
    <section className="ds-two-banner ds-pad-x">
      {banners.map((b, i) => (
        <Link key={i} href={b.href}>
          <img
            src={b.desktopImage}
            alt={b.alt}
            className="ds-hero-img-desktop"
            loading="lazy"
          />
          <img
            src={b.mobileImage}
            alt={b.alt}
            className="ds-hero-img-mobile"
            loading="lazy"
          />
        </Link>
      ))}
    </section>
  )
}

export function FourDBanner({
  banners,
}: {
  banners: { desktopImage: string; mobileImage: string; href: string; alt: string }[]
}) {
  return (
    <section className="ds-four-banner ds-pad-x">
      {banners.map((b, i) => (
        <Link key={i} href={b.href}>
          <img
            src={b.desktopImage}
            alt={b.alt}
            className="ds-hero-img-desktop"
            loading="lazy"
          />
          <img
            src={b.mobileImage}
            alt={b.alt}
            className="ds-hero-img-mobile"
            loading="lazy"
          />
        </Link>
      ))}
    </section>
  )
}

export function TrustBadgesRow({
  items,
}: {
  items: { title: string; image: string }[]
}) {
  return (
    <section className="ds-trust-row" aria-label="مزایای خرید از دیجی‌استایل">
      {items.map((item) => (
        <div key={item.title} className="ds-trust-item">
          <img src={item.image} alt={item.title} loading="lazy" />
          <span>{item.title}</span>
        </div>
      ))}
    </section>
  )
}
