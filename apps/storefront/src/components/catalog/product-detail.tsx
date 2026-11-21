"use client"

import Link from "next/link"
import { useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { toPersian } from "@/lib/format"
import type { CatalogProduct, ReviewStats } from "@/lib/medusa"
import { Icon, Media, Modal, number } from "../layout/ui"
import { colorHex, variantDiscount } from "./catalog"
import { WishlistButton } from "./product-card"

function Gallery({
  product,
  badgeTitle,
}: {
  product: CatalogProduct
  badgeTitle?: string
}) {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [shareMessage, setShareMessage] = useState("")
  const [zoom, setZoom] = useState({ x: 50, y: 50 })
  const images = [...new Set(product.images)]
  const move = (delta: number) =>
    setActive((index) => (index + delta + images.length) % images.length)
  const label = (index: number) =>
    `${product.title}، تصویر ${number(index + 1)}`

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href.split("#")[0])
        setShareMessage("پیوند محصول کپی شد.")
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setShareMessage("اشتراک‌گذاری ممکن نبود؛ نشانی را از مرورگر کپی کنید.")
    }
  }

  return (
    <div className="ds-pdp-gallery">
      {images.length > 1 && (
        <div className="ds-pdp-thumbs" aria-label="تصاویر محصول">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              className="ds-pdp-thumb"
              aria-label={label(index)}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="ds-pdp-main-frame">
        {images.length > 0 ? (
          <button
            className="ds-pdp-main-btn"
            type="button"
            aria-label="نمایش تصویر در اندازه بزرگ"
            onClick={() => setLightbox(true)}
            onPointerMove={(event) => {
              if (event.pointerType !== "mouse") return
              const rect = event.currentTarget.getBoundingClientRect()
              setZoom({
                x: ((event.clientX - rect.left) / rect.width) * 100,
                y: ((event.clientY - rect.top) / rect.height) * 100,
              })
            }}
            style={
              {
                "--store-zoom-origin": `${zoom.x}% ${zoom.y}%`,
              } as React.CSSProperties
            }
          >
            <img src={images[active]} alt={label(active)} />
          </button>
        ) : (
          <Media alt="" />
        )}

        {badgeTitle && (
          <span className="ds-pdp-promo-ribbon">{badgeTitle}</span>
        )}

        <div className="ds-pdp-overlay-actions">
          <WishlistButton product={product} className="ds-pdp-overlay-btn" />
          <button
            className="ds-pdp-overlay-btn"
            type="button"
            aria-label="اشتراک‌گذاری"
            onClick={() => {
              void share()
            }}
          >
            <Icon name="share" size={18} />
          </button>
          <button
            className="ds-pdp-overlay-btn"
            type="button"
            aria-label="بزرگ‌نمایی تصویر"
            onClick={() => setLightbox(true)}
          >
            <Icon name="expand" size={18} />
          </button>
        </div>

        {images.length > 1 && (
          <span className="ds-pdp-counter">
            {number(active + 1)} / {number(images.length)}
          </span>
        )}
      </div>

      {shareMessage && (
        <p role="status" className="store-share-status">
          {shareMessage}
        </p>
      )}

      {lightbox && (
        <Modal
          label="تصاویر محصول"
          onClose={() => setLightbox(false)}
          className="store-lightbox"
        >
          <div
            className="store-lightbox-body"
            onKeyDown={(event) => {
              if (images.length < 2) return
              if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                event.preventDefault()
                move(event.key === "ArrowLeft" ? 1 : -1)
              }
            }}
          >
            <Media src={images[active]} alt={label(active)} eager />
            {images.length > 1 && (
              <div className="store-lightbox-controls">
                <button
                  className="store-icon store-outline"
                  autoFocus
                  type="button"
                  aria-label="تصویر قبلی"
                  onClick={() => move(-1)}
                >
                  <Icon name="right" />
                </button>
                <span role="status">
                  {number(active + 1)} از {number(images.length)}
                </span>
                <button
                  className="store-icon store-outline"
                  type="button"
                  aria-label="تصویر بعدی"
                  onClick={() => move(1)}
                >
                  <Icon name="left" />
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

export function ProductDetail({
  product,
  stats,
}: {
  product: CatalogProduct
  stats: ReviewStats
}) {
  const { addToCart, colorMap } = useCommerce()
  const first =
    product.variants.find((variant) => variant.available) ?? product.variants[0]
  const [color, setColor] = useState(first?.color ?? "")
  const [size, setSize] = useState(first?.size ?? "")
  const [guide, setGuide] = useState(false)
  const [pending, setPending] = useState(false)
  const [added, setAdded] = useState(false)
  const [message, setMessage] = useState("")

  const colors = [
    ...new Set(
      product.variants.map((variant) => variant.color).filter(Boolean)
    ),
  ]
  const sizes = [
    ...new Set(product.variants.map((variant) => variant.size).filter(Boolean)),
  ]
  const options = product.variants.filter((variant) => variant.color === color)
  const selected = options.find((variant) => variant.size === size)
  const discount = selected ? variantDiscount(selected) : 0
  const isIrr = product.currency?.toLowerCase() === "irr"
  const toman = (amount: number) =>
    number(Math.round(isIrr ? amount / 10 : amount))

  const {
    seller_name,
    seller_stats,
    promo_badge,
    warranty,
    lead_time_days,
    return_policy,
    product_code,
    size_guide,
  } = product.metadata

  function chooseColor(nextColor: string) {
    const next = product.variants.filter(
      (variant) => variant.color === nextColor
    )
    setColor(nextColor)
    setSize(
      (
        next.find((variant) => variant.size === size && variant.available) ??
        next.find((variant) => variant.available) ??
        next.find((variant) => variant.size === size) ??
        next[0]
      )?.size ?? ""
    )
    setMessage("")
    setAdded(false)
  }

  return (
    <div className="ds-pdp-grid">
      <Gallery
        product={product}
        badgeTitle={promo_badge || (discount > 0 ? "حراج استایل" : undefined)}
      />

      <div className="ds-pdp-info">
        <div className="ds-pdp-brand-row">
          {product.brand && (
            <Link
              className="ds-pdp-brand"
              href={`/brands/${encodeURIComponent(product.brand.handle)}`}
            >
              {product.brand.name}
            </Link>
          )}
          {product_code && (
            <span className="ds-pdp-code">
              کد کالا: <bdi>{product_code}</bdi>
            </span>
          )}
        </div>

        <h1 className="ds-pdp-title">{product.title}</h1>

        {stats.total_count > 0 && (
          <div className="store-pdp-rating">
            <a href="#reviews">
              <span className="store-stars" aria-hidden="true">
                ★
              </span>{" "}
              {number(stats.average_rating)}{" "}
              <span>({number(stats.total_count)} دیدگاه)</span>
            </a>
            <span>
              <Icon name="check" size={16} />{" "}
              {number(Math.round(stats.recommendation_percentage))}٪ پیشنهاد
              خریداران
            </span>
          </div>
        )}

        <div className="ds-pdp-divider" />

        {colors.length > 0 && (
          <fieldset className="ds-pdp-fieldset">
            <legend className="ds-pdp-legend">
              <span>
                رنگ: <strong>{color}</strong>
              </span>
            </legend>
            <div className="ds-color-chips">
              {colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="ds-color-chip"
                  aria-pressed={color === option}
                  onClick={() => chooseColor(option)}
                >
                  <span
                    className="ds-color-dot"
                    style={{ backgroundColor: colorHex(option, colorMap) }}
                  />
                  <span>{option}</span>
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {(sizes.length > 0 || size_guide) && (
          <fieldset className="ds-pdp-fieldset">
            <legend className="ds-pdp-legend">
              <span>
                سایز{size && <>: <strong>{toPersian(size)}</strong></>}
              </span>
              {size_guide && (
                <button
                  type="button"
                  className="ds-size-guide-btn"
                  onClick={() => setGuide(true)}
                >
                  <Icon name="ruler" size={15} />
                  راهنمای سایز
                </button>
              )}
            </legend>
            <div className="ds-size-chips">
              {sizes.map((option) => {
                const available = options.some(
                  (variant) => variant.size === option && variant.available
                )
                return (
                  <button
                    key={option}
                    type="button"
                    className="ds-size-btn"
                    aria-label={`سایز ${toPersian(option)}${available ? "" : "، ناموجود"}`}
                    aria-pressed={size === option}
                    disabled={!available}
                    onClick={() => {
                      setSize(option)
                      setMessage("")
                      setAdded(false)
                    }}
                  >
                    <span>{toPersian(option)}</span>
                    {!available && (
                      <svg
                        className="ds-size-slash"
                        aria-hidden="true"
                        fill="none"
                        stroke="#d3d5d9"
                        strokeDasharray="3"
                      >
                        <rect
                          x="0.5"
                          y="0.5"
                          width="calc(100% - 1px)"
                          height="calc(100% - 1px)"
                        />
                        <line x1="0" y1="100%" x2="100%" y2="0" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        <div className="ds-buy-box">
          <div>
            <div className="ds-seller-row">
              <span className="ds-seller-name">
                فروشنده: {seller_name || "دیجی‌استایل"}
              </span>
              {seller_stats?.registration_date && (
                <span className="ds-pdp-code">
                  سابقه: {seller_stats.registration_date}
                </span>
              )}
            </div>
            {seller_stats && (
              <div className="ds-seller-stats" style={{ marginTop: 8 }}>
                {seller_stats.stars != null && (
                  <span>
                    عملکرد:{" "}
                    <strong>عالی ({number(seller_stats.stars)} از ۵)</strong>
                  </span>
                )}
                {seller_stats.ship_on_time != null && (
                  <span>
                    تأمین به موقع:{" "}
                    <strong>{number(seller_stats.ship_on_time)}٪</strong>
                  </span>
                )}
                {seller_stats.no_return != null && (
                  <span>
                    بدون مرجوعی:{" "}
                    <strong>{number(seller_stats.no_return)}٪</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <ul className="ds-buy-promises">
            {warranty && (
              <li>
                <Icon name="shield" size={17} />
                <span>{warranty}</span>
              </li>
            )}
            <li>
              <Icon name="truck" size={17} />
              <span>
                {lead_time_days == null || lead_time_days <= 1
                  ? "موجود در انبار دیجی‌استایل (ارسال سریع)"
                  : `آماده ارسال تا ${number(lead_time_days)} روز کاری`}
              </span>
            </li>
            {return_policy && (
              <li>
                <Icon name="check" size={17} />
                <span>{return_policy}</span>
              </li>
            )}
          </ul>

          <div className="ds-pdp-price-block">
            {selected && discount > 0 && (
              <div className="ds-card-old-row">
                <span className="ds-card-old-price">
                  {toman(selected.originalPrice)}
                </span>
                <span className="ds-discount-badge">٪{number(discount)}</span>
              </div>
            )}
            {selected?.available ? (
              <div className="ds-card-final-row">
                <span className="ds-pdp-price-main">
                  {toman(selected.price)}
                </span>
                <span className="ds-toman">تومان</span>
              </div>
            ) : (
              <span className="ds-card-oos">ناموجود</span>
            )}
          </div>

          <button
            className="ds-pdp-cta"
            type="button"
            disabled={!selected?.available || pending}
            onClick={async () => {
              if (!selected?.available || pending) return
              setPending(true)
              setMessage("")
              try {
                await addToCart(product, selected.id)
                setAdded(true)
              } catch {
                setMessage("افزودن به سبد خرید انجام نشد. دوباره تلاش کنید.")
              } finally {
                setPending(false)
              }
            }}
          >
            <Icon name="bag" size={19} />
            {pending
              ? "در حال افزودن…"
              : selected?.available
                ? "اضافه به سبد خرید"
                : "ترکیب انتخاب‌شده ناموجود است"}
          </button>

          {added && (
            <div className="ds-added-toast" role="status">
              <span>کالا به سبد خرید اضافه شد!</span>
              <Link href="/cart">برو به سبد خرید</Link>
            </div>
          )}

          {message && <p role="alert">{message}</p>}
        </div>
      </div>

      {guide && size_guide && (
        <Modal label="راهنمای سایز" onClose={() => setGuide(false)}>
          {size_guide.measurement_note && <p>{size_guide.measurement_note}</p>}
          <div className="store-table-scroll">
            <table className="store-size-table">
              <thead>
                <tr>
                  {size_guide.columns.map((column, index) => (
                    <th scope="col" key={index}>
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {size_guide.rows.map((row, index) => (
                  <tr key={index}>
                    {row.map((cell, column) => (
                      <td key={column}>{toPersian(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </div>
  )
}
