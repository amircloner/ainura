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
  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const images = [...new Set(product.images)]
  const move = (delta: number) =>
    setActive((index) => (index + delta + images.length) % images.length)
  const label = (index: number) =>
    `${product.title}، تصویر ${number(index + 1)}`

  function updateScroll(rail: HTMLDivElement) {
    setCanScrollUp(rail.scrollTop > 1)
    setCanScrollDown(rail.scrollTop + rail.clientHeight < rail.scrollHeight - 1)
  }

  function scrollRail(button: HTMLButtonElement, direction: number) {
    const rail = button.parentElement?.firstElementChild
    if (rail) rail.scrollBy({ top: direction * rail.clientHeight })
  }

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
        <div className="ds-pdp-thumbs" role="group" aria-label="تصاویر محصول">
          <div
            ref={(rail) => {
              if (!rail) return
              const observer = new ResizeObserver(() => updateScroll(rail))
              observer.observe(rail)
              return () => observer.disconnect()
            }}
            onScroll={(event) => updateScroll(event.currentTarget)}
          >
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
          <button
            className="ds-pdp-overlay-btn"
            type="button"
            aria-label="پیمایش به تصاویر قبلی"
            disabled={!canScrollUp}
            onClick={(event) => scrollRail(event.currentTarget, -1)}
          >
            <Icon name="down" />
          </button>
          <button
            className="ds-pdp-overlay-btn"
            type="button"
            aria-label="پیمایش به تصاویر بعدی"
            disabled={!canScrollDown}
            onClick={(event) => scrollRail(event.currentTarget, 1)}
          >
            <Icon name="down" />
          </button>
        </div>
      )}

      <div className="ds-pdp-main-frame">
        {images.length > 0 ? (
          <button
            className="ds-pdp-main-btn"
            type="button"
            aria-label="نمایش تصویر در اندازه بزرگ"
            onClick={() => setLightbox(true)}
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
        </div>
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
  const [fullDescription, setFullDescription] = useState(false)
  const [fullSpecs, setFullSpecs] = useState(false)

  const colors = [
    ...new Set(
      product.variants.map((variant) => variant.color).filter(Boolean)
    ),
  ]
  const sizes = [
    ...new Set(product.variants.map((variant) => variant.size).filter(Boolean)),
  ]
  if (sizes.every((value) => /^\d+$/.test(value))) {
    sizes.sort((a, b) => Number(a) - Number(b))
  }
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
  const specs = [
    ...(product.metadata.specifications ?? []),
    ...(product_code ? [{ label: "کد کالا", value: product_code }] : []),
  ]

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
        badgeTitle={discount > 0 ? `${number(discount)}٪` : promo_badge}
      />

      <div className="ds-pdp-info">
        <div className="ds-pdp-brand-row">
          {product.brand && (
            <Link
              className="ds-pdp-brand"
              href={`/brands/${encodeURIComponent(product.brand.handle)}`}
            >
              {product.brand.logo_url && (
                <img
                  src={product.brand.logo_url}
                  alt=""
                  width="48"
                  height="48"
                />
              )}
              {product.brand.name}
            </Link>
          )}
        </div>

        <h1 className="ds-pdp-title">{product.title}</h1>

        <div className="ds-pdp-rating">
          {stats.total_count > 0 && (
            <>
              <span className="store-stars">★</span>{" "}
              {number(stats.average_rating)}
            </>
          )}
          <a href="#reviews">
            {number(stats.total_count)} دیدگاه <Icon name="left" size={10} />
          </a>
        </div>

        <div className="ds-pdp-price-block" aria-live="polite">
          {selected?.available ? (
            <>
              {discount > 0 && <strong>{number(discount)}٪ تخفیف</strong>}
              <div className="ds-pdp-amounts">
                <b>
                  {toman(selected.price)} <small>تومان</small>
                </b>
                {discount > 0 && <del>{toman(selected.originalPrice)}</del>}
              </div>
            </>
          ) : (
            <strong>ناموجود</strong>
          )}
        </div>
        {(promo_badge || return_policy) && (
          <div className="ds-pdp-benefit">
            <span aria-hidden="true">
              {promo_badge ? "٪" : <Icon name="shield" size={24} />}
            </span>
            <div>
              <strong>{promo_badge || return_policy}</strong>
              {promo_badge && return_policy && <small>{return_policy}</small>}
            </div>
          </div>
        )}

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
                  aria-label={option}
                  title={option}
                  aria-pressed={color === option}
                  onClick={() => chooseColor(option)}
                >
                  {colors.length === 1 && product.images[0] ? (
                    <img src={product.images[0]} alt="" />
                  ) : (
                    <span
                      className="ds-color-dot"
                      style={{ backgroundColor: colorHex(option, colorMap) }}
                    />
                  )}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {(sizes.length > 0 || size_guide) && (
          <fieldset className="ds-pdp-fieldset">
            <legend className="ds-pdp-legend">
              <span>
                سایز
                {size && (
                  <>
                    : <strong>{toPersian(size)}</strong>
                  </>
                )}
              </span>
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
                  </button>
                )
              })}
            </div>
            {size_guide && (
              <button
                type="button"
                className="ds-size-guide-btn"
                onClick={() => setGuide(true)}
              >
                راهنمای سایز
                <Icon name="left" size={12} />
              </button>
            )}
          </fieldset>
        )}

        <div className="ds-pdp-purchase">
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
            {pending
              ? "در حال افزودن…"
              : selected?.available
                ? "اضافه به سبد خرید"
                : "ناموجود"}
          </button>
          <a
            href="#specifications"
            className="ds-pdp-action"
            aria-label="مشاهده مشخصات"
          >
            <Icon name="menu" />
          </a>
          <WishlistButton
            product={product}
            className="ds-pdp-action store-wishlist"
          />
        </div>
        {added && (
          <div className="ds-added-toast" role="status">
            <span>کالا به سبد خرید اضافه شد!</span>
            <Link href="/cart">برو به سبد خرید</Link>
          </div>
        )}
        {message && <p role="alert">{message}</p>}

        <section className="ds-buy-box ds-pdp-section">
          <h2>فروشنده</h2>
          <div>
            <div className="ds-seller-row">
              <span className="ds-seller-name">
                <Icon name="bag" /> {seller_name || "دیجی‌استایل"}
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
                    عملکرد: <strong>{number(seller_stats.stars)} از ۵</strong>
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
          </ul>
        </section>
        {product.description && (
          <section className="ds-pdp-section" id="review">
            <h2>نقد و بررسی</h2>
            <p className="ds-pdp-desc">
              {!fullDescription && product.description.length > 200
                ? `${product.description.slice(0, 200).trimEnd()}…`
                : product.description}
            </p>
            {product.description.length > 200 && (
              <button
                type="button"
                className="ds-pdp-more"
                aria-expanded={fullDescription}
                onClick={() => setFullDescription(!fullDescription)}
              >
                {fullDescription ? "بستن" : "خواندن همه"}
                <Icon name="left" size={12} />
              </button>
            )}
          </section>
        )}
        <section className="ds-pdp-section" id="specifications">
          <h2>مشخصات</h2>
          {specs.length > 0 && (
            <dl className="ds-specs-table">
              {(fullSpecs ? specs : specs.slice(0, 6)).map(
                ({ label, value }, index) => (
                  <div className="ds-specs-row" key={index}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                )
              )}
            </dl>
          )}
          {specs.length > 6 && (
            <button
              type="button"
              className="ds-pdp-more"
              aria-expanded={fullSpecs}
              onClick={() => setFullSpecs(!fullSpecs)}
            >
              {fullSpecs ? "بستن" : "خواندن ادامه"}
              <Icon name="left" size={12} />
            </button>
          )}
          {((product.categories?.length ?? 0) > 0 ||
            (product.tags?.length ?? 0) > 0) && (
            <div className="ds-pdp-taxonomy">
              {(product.categories?.length ?? 0) > 0 && (
                <div className="ds-pdp-taxonomy-row">
                  <span>دسته‌بندی‌ها:</span>
                  <div className="ds-pdp-taxonomy-links">
                    {product.categories!.map((cat) => (
                      <Link
                        key={cat.handle}
                        href={`/categories/${encodeURIComponent(cat.handle)}`}
                        className="store-tag-pill"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {(product.tags?.length ?? 0) > 0 && (
                <div className="ds-pdp-taxonomy-row">
                  <span>برچسب‌ها:</span>
                  <div className="ds-pdp-taxonomy-links">
                    {product.tags!.map((tag) => (
                      <Link
                        key={tag.id}
                        href={`/tags/${encodeURIComponent(tag.handle)}`}
                        className="store-tag-pill"
                      >
                        #{tag.value}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
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
