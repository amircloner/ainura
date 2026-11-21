"use client"

import Link from "next/link"
import { useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { formatPrice, toPersian } from "@/lib/format"
import type { CatalogProduct, ReviewStats } from "@/lib/medusa"
import { Icon, Media, Modal, number } from "../layout/ui"
import { colorHex, variantDiscount } from "./catalog"
import { WishlistButton } from "./product-card"

function Gallery({ product }: { product: CatalogProduct }) {
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
      if (navigator.share)
        await navigator.share({
          title: product.title,
          url: window.location.href,
        })
      else {
        await navigator.clipboard.writeText(window.location.href.split("#")[0])
        setShareMessage("پیوند کپی شد.")
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === "AbortError"))
        setShareMessage("اشتراک‌گذاری ممکن نبود؛ نشانی را از مرورگر کپی کنید.")
    }
  }

  return (
    <div className="store-gallery">
      <div className="store-gallery-frame">
        {images.length > 0 ? (
          <button
            className="store-gallery-image"
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
            <Media src={images[active]} alt={label(active)} eager />
            <span className="store-gallery-expand">
              <Icon name="expand" size={19} />
            </span>
          </button>
        ) : (
          <Media alt="" />
        )}
        <div className="store-gallery-actions">
          <WishlistButton product={product} />
          <button
            className="store-icon"
            type="button"
            aria-label="اشتراک‌گذاری"
            onClick={() => {
              void share()
            }}
          >
            <Icon name="share" />
          </button>
        </div>
      </div>
      <p role="status" className="store-share-status">
        {shareMessage}
      </p>
      {images.length > 1 && (
        <div className="store-gallery-thumbs" aria-label="تصاویر محصول">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              aria-label={label(index)}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <Media src={src} alt="" />
            </button>
          ))}
        </div>
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
  const { addToCart } = useCommerce()
  const first =
    product.variants.find((variant) => variant.available) ?? product.variants[0]
  const [color, setColor] = useState(first?.color ?? "")
  const [size, setSize] = useState(first?.size ?? "")
  const [guide, setGuide] = useState(false)
  const [pending, setPending] = useState(false)
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
  const {
    seller_name,
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
  }

  return (
    <div className="store-pdp-layout">
      <Gallery product={product} />
      <div className="store-pdp-info">
        <div className="store-pdp-labels">
          {product.brand && (
            <Link href={`/brands/${encodeURIComponent(product.brand.handle)}`}>
              {product.brand.name} <Icon name="left" size={13} />
            </Link>
          )}
          {warranty && (
            <span>
              <Icon name="shield" size={16} /> کالای اصل
            </span>
          )}
        </div>
        <h1>{product.title}</h1>
        {product_code && (
          <div className="store-product-code">
            کد محصول <bdi>{product_code}</bdi>
          </div>
        )}
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
              <Icon name="check" size={17} />{" "}
              {number(Math.round(stats.recommendation_percentage))}٪ از خریداران
              این کالا را پیشنهاد کرده‌اند
            </span>
          </div>
        )}
        {colors.length > 0 && (
          <fieldset className="store-variant">
            <legend>
              رنگ: <strong>{color}</strong>
            </legend>
            <div className="store-variant-colors">
              {colors.map((option) => (
                <button
                  key={option}
                  type="button"
                  className="store-swatch"
                  style={{ backgroundColor: colorHex(option) }}
                  title={option}
                  aria-label={option}
                  aria-pressed={color === option}
                  onClick={() => chooseColor(option)}
                />
              ))}
            </div>
          </fieldset>
        )}
        {(sizes.length > 0 || size_guide) && (
          <fieldset className="store-variant">
            <legend>
              سایز
              {size && (
                <>
                  : <strong>{toPersian(size)}</strong>
                </>
              )}
            </legend>
            <div className="store-size-options">
              {sizes.map((option) => {
                const available = options.some(
                  (variant) => variant.size === option && variant.available
                )
                return (
                  <button
                    key={option}
                    type="button"
                    aria-label={`سایز ${toPersian(option)}${available ? "" : "، ناموجود"}`}
                    aria-pressed={size === option}
                    disabled={!available}
                    onClick={() => {
                      setSize(option)
                      setMessage("")
                    }}
                  >
                    {toPersian(option)}
                  </button>
                )
              })}
            </div>
            {size_guide && (
              <button
                type="button"
                className="store-size-guide"
                onClick={() => setGuide(true)}
              >
                <Icon name="ruler" size={18} />
                راهنمای سایز
              </button>
            )}
          </fieldset>
        )}
        <div className="store-seller">
          {seller_name && <h2>{seller_name}</h2>}
          <ul>
            {warranty && (
              <li>
                <Icon name="shield" size={17} />
                {warranty}
              </li>
            )}
            {lead_time_days != null && (
              <li>
                <Icon name="truck" size={18} />
                {lead_time_days <= 1
                  ? "ارسال سریع"
                  : `آماده ارسال تا ${number(lead_time_days)} روز کاری`}
              </li>
            )}
            {return_policy && (
              <li>
                <Icon name="check" size={18} />
                {return_policy}
              </li>
            )}
          </ul>
          <div className="store-pdp-price">
            {selected && discount > 0 && (
              <div>
                <span className="store-sale-badge">٪{number(discount)}</span>
                <del>
                  {formatPrice(selected.originalPrice, product.currency)}
                </del>
              </div>
            )}
            <strong>
              {selected?.available
                ? formatPrice(selected.price, product.currency)
                : "ناموجود"}
            </strong>
          </div>
          <button
            className="store-button"
            type="button"
            disabled={!selected?.available || pending}
            onClick={async () => {
              if (!selected?.available || pending) return
              setPending(true)
              setMessage("")
              try {
                await addToCart(product, selected.id)
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
                ? "افزودن به سبد خرید"
                : "ترکیب انتخاب‌شده ناموجود است"}
          </button>
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
