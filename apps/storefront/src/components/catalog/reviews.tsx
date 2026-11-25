"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useCommerce } from "@/lib/commerce"
import {
  submitReview,
  getReviewFeedback,
  setReviewFeedback,
  type ReviewFeedback,
  type ReviewVote,
  type CatalogReview,
  type ReviewStats,
} from "@/lib/medusa"
import { Icon, Modal, number } from "../layout/ui"
import { orderReviews } from "./review-order"

const RATINGS = [5, 4, 3, 2, 1] as const
const date = new Intl.DateTimeFormat("fa-IR", {
  dateStyle: "medium",
  timeZone: "Asia/Tehran",
})

function Stars({ rating }: { rating: number }) {
  return (
    <span
      className="ds-review-stars"
      role="img"
      aria-label={`${number(rating)} از ۵ ستاره`}
    >
      {RATINGS.map((key, index) => (
        <span
          key={key}
          aria-hidden="true"
          style={{
            background: `linear-gradient(to left, #ffb400 ${Math.min(1, Math.max(0, rating - index)) * 100}%, #ececee 0)`,
          }}
        />
      ))}
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
  const [sort, setSort] = useState<"helpful" | "buyers" | "newest">("helpful")
  const [feedback, setFeedback] = useState<Record<string, ReviewFeedback>>({})
  const [voting, setVoting] = useState("")
  const [voteError, setVoteError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let current = true
    setFeedback({})
    setVoteError("")
    if (!demo && reviews.length) {
      getReviewFeedback(productId)
        .then((data) => {
          if (current) setFeedback(data)
        })
        .catch(() => {
          if (current) setVoteError("دریافت رأی‌ها ممکن نبود.")
        })
    }
    return () => {
      current = false
    }
  }, [productId, customer?.id, demo, reviews.length, attempt])
  const visibleReviews = orderReviews(reviews, sort, feedback)
  async function vote(id: string, direction: ReviewVote) {
    if (voting || !customer || !feedback[id]) return
    setVoting(id)
    setVoteError("")
    try {
      const data = await setReviewFeedback(
        productId,
        id,
        feedback[id].current_vote === direction ? null : direction
      )
      setFeedback((prev) => ({ ...prev, [id]: data }))
    } catch {
      setVoteError("ثبت رأی ممکن نبود.")
    } finally {
      setVoting("")
    }
  }
  const loginHref = `/account?${new URLSearchParams({ next: `/products/${encodeURIComponent(productHandle)}#reviews` })}`

  return (
    <div className="store-review-layout">
      <aside className="store-review-summary">
        {stats.total_count ? (
          <div className="ds-review-score">
            <strong>{number(stats.average_rating)}</strong> از ۵
          </div>
        ) : (
          <p>هنوز امتیازی ثبت نشده است</p>
        )}
        <div className="ds-review-total">
          <Stars rating={stats.average_rating} />
          {stats.total_count > 0 && (
            <small>از مجموع {number(stats.total_count)} امتیاز</small>
          )}
        </div>
        <p className="ds-review-invite">
          شما هم درباره این کالا دیدگاه ثبت کنید
        </p>
        {!customer && !demo ? (
          <Link className="store-button store-outline" href={loginHref}>
            ثبت دیدگاه
          </Link>
        ) : (
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
        )}
        {message && <p role="status">{message}</p>}
      </aside>
      <div className="store-review-list">
        {reviews.length > 0 && (
          <div
            className="ds-review-sort"
            role="group"
            aria-label="مرتب‌سازی دیدگاه‌ها"
          >
            <strong>
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 3v16m-3-3 3 3 3-3M11 5h11M11 11h8M11 17h5" />
              </svg>
              مرتب سازی:
            </strong>
            {(
              [
                ["newest", "جدیدترین"],
                ["buyers", "دیدگاه خریداران"],
                ["helpful", "مفیدترین"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-pressed={sort === value}
                onClick={() => {
                  setSort(value)
                  setLimit(4)
                }}
              >
                {label}
              </button>
            ))}
            <span>
              {number(
                sort === "buyers" ? visibleReviews.length : stats.total_count
              )}{" "}
              دیدگاه
            </span>
          </div>
        )}
        {demo && reviews.length > 0 && (
          <p className="store-muted">این دیدگاه‌ها نمونه و ساختگی هستند.</p>
        )}
        {voteError && (
          <p role="status">
            {voteError}{" "}
            <button
              type="button"
              className="ds-review-retry"
              onClick={() => setAttempt((n) => n + 1)}
            >
              دریافت دوبارهٔ رأی‌ها
            </button>
          </p>
        )}
        {!visibleReviews.length && (
          <div className="ds-review-empty">
            {reviews.length ? (
              <p>هنوز دیدگاهی از خریداران ثبت نشده است.</p>
            ) : (
              <>
                <strong>شما هم می‌توانید در مورد این کالا نظر دهید.</strong>
                <p>
                  دیدگاه خریداران با نشان «خریدار» مشخص می‌شود. همچنین در صورت
                  تمایل می‌توانید به صورت ناشناس نیز دیدگاه خود را ثبت کنید.
                </p>
              </>
            )}
          </div>
        )}
        {visibleReviews.slice(0, limit).map((review) => (
          <article className="store-review" key={review.id}>
            <div className="store-review-meta">
              <span>{review.customer_name || "کاربر دیجی‌استایل"}</span>
              {review.verified_purchase && (
                <span className="store-verified">خریدار</span>
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
            {(!!review.pros?.length || !!review.cons?.length) && (
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
            )}
            {!demo && (
              <div className="ds-review-votes" aria-label="ارزیابی دیدگاه">
                {(["helpful", "unhelpful"] as const).map((direction) => {
                  const state = feedback[review.id]
                  const label =
                    direction === "helpful" ? "مفید بود" : "مفید نبود"
                  const contents = (
                    <>
                      {state ? number(state[direction]) : "ـ"}
                      <svg
                        width="19"
                        height="19"
                        viewBox="0 0 24 24"
                        style={{
                          transform:
                            direction === "unhelpful"
                              ? "rotate(180deg)"
                              : undefined,
                        }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        aria-hidden="true"
                      >
                        <path d="M3 10h4v11H3zm4 1 5-7c1-2 4-1 3 2l-1 4h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />
                      </svg>
                    </>
                  )
                  return customer ? (
                    <button
                      type="button"
                      key={direction}
                      aria-label={label}
                      aria-pressed={state?.current_vote === direction}
                      disabled={!!voting || !state}
                      onClick={() => void vote(review.id, direction)}
                    >
                      {contents}
                    </button>
                  ) : (
                    <Link
                      key={direction}
                      aria-label={`${label}؛ ورود به حساب کاربری`}
                      href={loginHref}
                    >
                      {contents}
                    </Link>
                  )
                })}
              </div>
            )}
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
              <Link href={loginHref} className="store-button">
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
                    customer_name: form.has("anonymous")
                      ? "کاربر دیجی‌استایل"
                      : undefined,
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
                <input type="checkbox" name="anonymous" /> ثبت دیدگاه به صورت
                ناشناس
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
