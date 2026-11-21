"use client"

import Link from "next/link"
import { useState } from "react"
import { useCommerce } from "@/lib/commerce"
import {
  submitReview,
  type CatalogReview,
  type ReviewStats,
} from "@/lib/medusa"
import { Icon, Modal, number } from "../layout/ui"

const RATINGS = [5, 4, 3, 2, 1] as const
const date = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "medium",
  timeZone: "Asia/Tehran",
})

function Stars({ rating }: { rating: number }) {
  const filled = Math.min(5, Math.max(0, Math.round(rating)))
  return (
    <span
      className="store-stars"
      dir="ltr"
      role="img"
      aria-label={`${number(rating)} از ۵ ستاره`}
    >
      {"★".repeat(filled)}
      <span>{"☆".repeat(5 - filled)}</span>
    </span>
  )
}

export function Reviews({
  productId,
  productHandle,
  demo,
  reviews,
  stats,
}: {
  productId: string
  productHandle: string
  demo?: boolean
  reviews: CatalogReview[]
  stats: ReviewStats
}) {
  const { customer } = useCommerce()
  const [writing, setWriting] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [limit, setLimit] = useState(4)
  const [filter, setFilter] = useState(0)
  const visibleReviews = reviews.filter(
    (review) => !filter || review.rating === filter
  )

  return (
    <div className="store-review-layout">
      <aside className="store-review-summary">
        {stats.total_count ? (
          <>
            <strong>
              {number(stats.average_rating)} <small>از ۵</small>
            </strong>
            <Stars rating={stats.average_rating} />
            <p>بر اساس {number(stats.total_count)} دیدگاه</p>
            <p>
              <Icon name="check" size={16} />{" "}
              {number(Math.round(stats.recommendation_percentage))}٪ پیشنهاد
              خرید
            </p>
            <div className="store-distribution" aria-label="توزیع امتیازها">
              {RATINGS.map((rating) => (
                <button
                  className="store-rating-row"
                  key={rating}
                  type="button"
                  aria-label={`فیلتر ${number(rating)} ستاره، ${number(stats.distribution[rating] ?? 0)} دیدگاه`}
                  aria-pressed={filter === rating}
                  onClick={() => {
                    setLimit(4)
                    setFilter(filter === rating ? 0 : rating)
                  }}
                >
                  <span>{number(rating)} ★</span>
                  <progress
                    max={stats.total_count}
                    value={stats.distribution[rating] ?? 0}
                    aria-label={`دیدگاه‌های ${number(rating)} ستاره`}
                  />
                  <span>{number(stats.distribution[rating] ?? 0)}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>هنوز دیدگاهی ثبت نشده است.</p>
        )}
        <button
          className="store-button store-outline"
          type="button"
          onClick={() => {
            setError("")
            setWriting(true)
          }}
        >
          ثبت دیدگاه
        </button>
        {message && <p role="status">{message}</p>}
      </aside>
      <div className="store-review-list">
        {demo && reviews.length > 0 && (
          <p className="store-muted">این دیدگاه‌ها نمونه و ساختگی هستند.</p>
        )}
        {filter > 0 && (
          <button
            className="store-button store-outline"
            type="button"
            onClick={() => {
              setFilter(0)
              setLimit(4)
            }}
          >
            نمایش همه دیدگاه‌ها <Icon name="close" size={15} />
          </button>
        )}
        {!visibleReviews.length && (
          <p className="store-muted">
            {filter
              ? "دیدگاه قابل نمایشی با این امتیاز نیست."
              : "هنوز دیدگاهی برای این محصول درج نشده است."}
          </p>
        )}
        {visibleReviews.slice(0, limit).map((review) => (
          <article className="store-review" key={review.id}>
            <div className="store-review-meta">
              <strong>{review.customer_name}</strong>
              {review.verified_purchase && (
                <span className="store-verified">
                  <Icon name="check" size={14} /> خریدار تأییدشده
                </span>
              )}
              {review.created_at &&
                !Number.isNaN(new Date(review.created_at).getTime()) && (
                  <time dateTime={review.created_at}>
                    {date.format(new Date(review.created_at))}
                  </time>
                )}
            </div>
            <Stars rating={review.rating} />
            {review.title && <h3>{review.title}</h3>}
            <p>{review.content}</p>
            {review.is_recommended && (
              <p className="store-verified">
                <Icon name="check" size={15} /> خرید این کالا را پیشنهاد می‌کنم.
              </p>
            )}
            <div className="store-review-points">
              {!!review.pros?.length && (
                <div>
                  <strong>نکات مثبت</strong>
                  <ul>
                    {review.pros.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              {!!review.cons?.length && (
                <div>
                  <strong>نکات منفی</strong>
                  <ul>
                    {review.cons.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </article>
        ))}
        {visibleReviews.length > limit && (
          <button
            className="store-button store-outline"
            type="button"
            onClick={() => setLimit(limit + 4)}
          >
            دیدگاه‌های بیشتر
          </button>
        )}
      </div>
      {writing && (
        <Modal
          label="ثبت دیدگاه"
          onClose={() => {
            if (!pending) setWriting(false)
          }}
        >
          {demo ? (
            <p>ثبت دیدگاه برای محصول نمونه در دسترس نیست.</p>
          ) : !customer ? (
            <div className="store-review-form">
              <p>برای ثبت دیدگاه وارد حساب کاربری خود شوید.</p>
              <Link
                href={`/account?${new URLSearchParams({ next: `/products/${encodeURIComponent(productHandle)}#reviews` })}`}
                className="store-button"
              >
                ورود به حساب کاربری
              </Link>
            </div>
          ) : (
            <form
              className="store-review-form"
              onSubmit={async (event) => {
                event.preventDefault()
                if (pending) return
                const form = new FormData(event.currentTarget)
                const text = (name: string) =>
                  String(form.get(name) ?? "").trim()
                const content = text("content")
                const rating = Number(text("rating"))
                if (!content || !RATINGS.some((value) => value === rating)) {
                  setError("امتیاز و متن دیدگاه الزامی است.")
                  return
                }
                const points = (name: string) =>
                  text(name)
                    .split(/[\n،,]/)
                    .map((value) => value.trim())
                    .filter(Boolean)
                setPending(true)
                setError("")
                try {
                  await submitReview(productId, {
                    rating,
                    content,
                    title: text("title") || undefined,
                    pros: points("pros"),
                    cons: points("cons"),
                    is_recommended: form.has("recommended"),
                  })
                  setMessage(
                    "دیدگاه شما ثبت شد و پس از بررسی نمایش داده می‌شود."
                  )
                  setWriting(false)
                } catch {
                  setError("ثبت دیدگاه ممکن نبود. دوباره تلاش کنید.")
                } finally {
                  setPending(false)
                }
              }}
            >
              <label>
                امتیاز
                <select name="rating" required defaultValue="">
                  <option value="" disabled>
                    انتخاب امتیاز
                  </option>
                  {RATINGS.map((rating) => (
                    <option key={rating} value={rating}>
                      {number(rating)} ستاره
                    </option>
                  ))}
                </select>
              </label>
              <label>
                عنوان
                <input name="title" maxLength={150} />
              </label>
              <label>
                متن دیدگاه
                <textarea name="content" required rows={4} maxLength={2000} />
              </label>
              <label>
                نکات مثبت (با ویرگول جدا کنید)
                <input name="pros" maxLength={300} />
              </label>
              <label>
                نکات منفی (با ویرگول جدا کنید)
                <input name="cons" maxLength={300} />
              </label>
              <label>
                <input type="checkbox" name="recommended" defaultChecked /> این
                کالا را پیشنهاد می‌کنم.
              </label>
              {error && <p role="alert">{error}</p>}
              <button className="store-button" type="submit" disabled={pending}>
                {pending ? "در حال ارسال…" : "ارسال دیدگاه"}
              </button>
            </form>
          )}
        </Modal>
      )}
    </div>
  )
}
