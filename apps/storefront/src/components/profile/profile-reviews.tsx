"use client"

import type { HttpTypes } from "@medusajs/types"
import { useState } from "react"
import { useCommerce } from "@/lib/commerce"
import { toPersian } from "@/lib/format"
import { sdk } from "@/lib/medusa"
import { formatPersianDate } from "@/lib/profile"
import {
  ProfileEmpty,
  ProfileLink,
  ProfileLoad,
  ProfilePanel,
} from "./profile-ui"
import { useProfileResource } from "./resource"
import styles from "./profile.module.css"

type Review = Pick<
  HttpTypes.StoreProductReview,
  "id" | "product_id" | "rating" | "title" | "content" | "status" | "created_at"
>

const REVIEW_STATUS = {
  pending: "در انتظار بررسی",
  approved: "منتشر شده",
  rejected: "تأیید نشده",
}

async function loadReviews() {
  try {
    const all: Review[] = []
    for (let offset = 0; ;) {
      const { reviews, count } = await sdk.client.fetch<{
        reviews: Review[]
        count: number
      }>("/store/customers/me/reviews", {
        query: { limit: 30, offset, order: "-created_at" },
      })
      all.push(...reviews)
      offset += reviews.length
      if (!reviews.length || offset >= count) return all
    }
  } catch (error) {
    if ((error as { status?: number } | null)?.status === 404) return null
    throw error
  }
}

export function ProfileReviews() {
  const { catalog } = useCommerce()
  const resource = useProfileResource(loadReviews)
  const [visible, setVisible] = useState(8)
  const products = new Map(catalog.map((product) => [product.id, product]))

  return (
    <ProfilePanel title="دیدگاه‌های من">
      {resource.status !== "ready" ? (
        <ProfileLoad status={resource.status} retry={resource.retry} />
      ) : !resource.data ? (
        <ProfileEmpty
          icon="message"
          title="سرویس تاریخچه دیدگاه‌ها در دسترس نیست."
        />
      ) : !resource.data.length ? (
        <ProfileEmpty icon="message" title="هنوز دیدگاهی ثبت نکرده‌اید.">
          <ProfileLink href="/products">مرور محصولات</ProfileLink>
        </ProfileEmpty>
      ) : (
        <div className={styles.entries}>
          {resource.data.slice(0, visible).map((review) => {
            const product = products.get(review.product_id)
            return (
              <article key={review.id} className={styles.entry}>
                <div className={styles.entryTop}>
                  <h3>{review.title || product?.title || "دیدگاه محصول"}</h3>
                  <span className={styles.badge}>
                    {REVIEW_STATUS[review.status]}
                  </span>
                </div>
                <p>{review.content}</p>
                <div className={styles.entryBottom}>
                  <span>امتیاز {toPersian(review.rating)} از ۵</span>
                  <span className={styles.muted}>
                    {formatPersianDate(review.created_at)}
                  </span>
                  {product && (
                    <ProfileLink
                      href={`/products/${encodeURIComponent(product.handle)}#reviews`}
                    >
                      مشاهده محصول
                    </ProfileLink>
                  )}
                </div>
              </article>
            )
          })}
          {visible < resource.data.length && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setVisible(visible + 8)}
            >
              دیدگاه‌های بیشتر
            </button>
          )}
        </div>
      )}
    </ProfilePanel>
  )
}
