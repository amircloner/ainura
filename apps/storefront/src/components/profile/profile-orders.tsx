"use client"

import type { HttpTypes } from "@medusajs/types"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useState } from "react"
import { Icon, Media, Modal } from "@/components/layout/ui"
import { formatPrice, latinDigits, toPersian } from "@/lib/format"
import { sdk } from "@/lib/medusa"
import {
  classifyOrderStatus,
  computeOrderStats,
  formatPersianDate,
  formatPersianPhone,
  ORDER_EMPTY_TITLES,
  ORDER_TABS,
  orderStatusLabel,
  type OrderStatusBucket,
} from "@/lib/profile"
import {
  ProfileEmpty,
  ProfileLink,
  ProfileLoad,
  ProfilePanel,
  type ProfileIcon,
} from "./profile-ui"
import { useProfileResource } from "./resource"
import styles from "./profile.module.css"

const PAGE_SIZE = 8
const STATUS_ICONS: Record<Exclude<OrderStatusBucket, "all">, ProfileIcon> = {
  in_progress: "clock",
  sent: "truck",
  returned: "return",
  cancelled: "close",
}

async function loadOrders() {
  const orders = new Map<string, HttpTypes.StoreOrder>()
  for (let offset = 0; ;) {
    const result = await sdk.store.order.list({
      limit: 50,
      offset,
      order: "-created_at",
      fields:
        "+payment_status,+fulfillment_status,+shipping_address,+shipping_total,+discount_total,*items",
    })
    for (const order of result.orders) orders.set(order.id, order)
    offset += result.orders.length
    if (
      !result.orders.length ||
      offset >= result.count ||
      result.orders.length < (result.limit ?? 50)
    ) {
      return [...orders.values()]
    }
  }
}

export function ProfileOrders({ overview = false }: { overview?: boolean }) {
  const resource = useProfileResource(loadOrders)
  const heading = overview ? "سفارش‌های من" : undefined
  const action = overview && (
    <ProfileLink href="/profile/orders">همه سفارش‌ها</ProfileLink>
  )

  return (
    <ProfilePanel title={heading} action={action}>
      {resource.status !== "ready" ? (
        <ProfileLoad status={resource.status} retry={resource.retry} />
      ) : overview ? (
        <OrderOverview orders={resource.data} />
      ) : (
        <Suspense
          fallback={<ProfileLoad status="loading" retry={resource.retry} />}
        >
          <OrderHistory orders={resource.data} />
        </Suspense>
      )}
    </ProfilePanel>
  )
}

function OrderOverview({ orders }: { orders: HttpTypes.StoreOrder[] }) {
  const stats = computeOrderStats(orders)
  return (
    <>
      <div className={styles.metrics}>
        {ORDER_TABS.map(({ type, title }) =>
          type === "all" ? null : (
            <Link
              key={type}
              href={orderFilterHref(type)}
              className={styles.metric}
            >
              <Icon name={STATUS_ICONS[type]} size={21} />
              <strong>{toPersian(stats[type])}</strong>
              <span>{title}</span>
            </Link>
          )
        )}
      </div>
      {orders.length ? (
        <div className={styles.entries}>
          <OrderEntry order={orders[0]} />
        </div>
      ) : (
        <ProfileEmpty icon="box" title={ORDER_EMPTY_TITLES.all}>
          <ProfileLink href="/products">مرور محصولات</ProfileLink>
        </ProfileEmpty>
      )}
    </>
  )
}

function orderFilterHref(type: OrderStatusBucket) {
  return type === "all" ? "/profile/orders" : `/profile/orders?status=${type}`
}

function OrderHistory({ orders }: { orders: HttpTypes.StoreOrder[] }) {
  const current = useSearchParams().get("status")
  const bucket = ORDER_TABS.find(({ type }) => type === current)?.type ?? "all"
  return <OrderResults key={bucket} bucket={bucket} orders={orders} />
}

function OrderResults({
  bucket,
  orders,
}: {
  bucket: OrderStatusBucket
  orders: HttpTypes.StoreOrder[]
}) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const filtered = orders.filter(
    (order) => bucket === "all" || classifyOrderStatus(order) === bucket
  )
  const needle = latinDigits(query.trim()).toLowerCase()
  const results = filtered.filter((order) =>
    latinDigits(String(orderNumber(order)))
      .toLowerCase()
      .includes(needle)
  )
  const lastPage = Math.max(1, Math.ceil(results.length / PAGE_SIZE))

  return (
    <>
      <nav className={styles.filters} aria-label="وضعیت سفارش">
        {ORDER_TABS.map(({ type, title }) => (
          <Link
            key={type}
            href={orderFilterHref(type)}
            aria-current={type === bucket ? "page" : undefined}
            scroll={false}
          >
            {title}
          </Link>
        ))}
      </nav>
      {filtered.length > 0 && (
        <label className={styles.search}>
          <Icon name="search" size={18} />
          <input
            type="search"
            aria-label="جست‌وجوی شماره سفارش"
            placeholder="جست‌وجوی شماره سفارش"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>
      )}
      {results.length ? (
        <>
          <div className={styles.entries}>
            {results
              .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
              .map((order) => (
                <OrderEntry key={order.id} order={order} />
              ))}
          </div>
          {lastPage > 1 && (
            <nav className={styles.pagination} aria-label="صفحه‌بندی سفارش‌ها">
              <button
                className={styles.secondary}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                قبلی
              </button>
              <span>
                صفحه {toPersian(page)} از {toPersian(lastPage)}
              </span>
              <button
                className={styles.secondary}
                disabled={page === lastPage}
                onClick={() => setPage(page + 1)}
              >
                بعدی
              </button>
            </nav>
          )}
        </>
      ) : (
        <ProfileEmpty
          icon="box"
          title={
            needle
              ? "سفارشی با این شماره پیدا نشد."
              : ORDER_EMPTY_TITLES[bucket]
          }
        >
          {bucket === "all" && !needle && (
            <ProfileLink href="/products">مرور محصولات</ProfileLink>
          )}
        </ProfileEmpty>
      )}
    </>
  )
}

function orderNumber(order: HttpTypes.StoreOrder) {
  return order.custom_display_id || order.display_id || order.id
}

function OrderEntry({ order }: { order: HttpTypes.StoreOrder }) {
  const [open, setOpen] = useState(false)
  const code = toPersian(orderNumber(order))
  return (
    <article className={styles.entry}>
      <div className={styles.entryTop}>
        <div>
          <h3>
            سفارش <bdi>{code}</bdi>
          </h3>
          <p className={styles.muted}>{formatPersianDate(order.created_at)}</p>
        </div>
        <span className={styles.badge} data-tone={classifyOrderStatus(order)}>
          {orderStatusLabel(order)}
        </span>
      </div>
      <div className={styles.entryBottom}>
        <div className={styles.thumbs}>
          {(order.items ?? []).slice(0, 4).map((item) => (
            <Media key={item.id} src={item.thumbnail} alt={item.title} />
          ))}
          {(order.items?.length ?? 0) > 4 && (
            <span>+{toPersian(order.items!.length - 4)}</span>
          )}
        </div>
        <strong>{formatPrice(order.total, order.currency_code)}</strong>
        <button
          className={styles.textLink}
          type="button"
          onClick={() => setOpen(true)}
        >
          جزئیات سفارش <Icon name="left" size={16} />
        </button>
      </div>
      {open && <OrderDetails order={order} onClose={() => setOpen(false)} />}
    </article>
  )
}

function OrderDetails({
  order,
  onClose,
}: {
  order: HttpTypes.StoreOrder
  onClose: () => void
}) {
  const destination = order.shipping_address
  const price = (amount: number) => formatPrice(amount, order.currency_code)
  return (
    <Modal
      className={styles.dialog}
      label={`سفارش ${toPersian(orderNumber(order))}`}
      onClose={onClose}
    >
      <div className={styles.detail}>
        <dl className={styles.detailsGrid}>
          <div>
            <dt>تاریخ ثبت</dt>
            <dd>{formatPersianDate(order.created_at)}</dd>
          </div>
          <div>
            <dt>وضعیت</dt>
            <dd>{orderStatusLabel(order)}</dd>
          </div>
        </dl>
        {destination && (
          <div>
            <h3>نشانی تحویل</h3>
            <p>
              {[
                destination.province,
                destination.city,
                destination.address_1,
                destination.address_2,
              ]
                .filter(Boolean)
                .join("، ")}
            </p>
            <p>
              {[destination.first_name, destination.last_name]
                .filter(Boolean)
                .join(" ")}{" "}
              <bdi>{formatPersianPhone(destination.phone)}</bdi>
            </p>
          </div>
        )}
        <ul className={styles.orderItems}>
          {order.items?.map((item) => (
            <li key={item.id}>
              <Media src={item.thumbnail} alt="" />
              <div>
                {item.product_handle ? (
                  <Link
                    href={`/products/${encodeURIComponent(item.product_handle)}`}
                  >
                    {item.title}
                  </Link>
                ) : (
                  item.title
                )}
                <p className={styles.muted}>
                  {[item.variant_title, `${toPersian(item.quantity)} عدد`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <strong>{price(item.unit_price * item.quantity)}</strong>
            </li>
          ))}
        </ul>
        <dl className={styles.totals}>
          {typeof order.shipping_total === "number" && (
            <div>
              <dt>ارسال</dt>
              <dd>{price(order.shipping_total)}</dd>
            </div>
          )}
          {!!order.discount_total && (
            <div>
              <dt>تخفیف</dt>
              <dd>{price(order.discount_total)}</dd>
            </div>
          )}
          <div>
            <dt>مبلغ نهایی</dt>
            <dd>{price(order.total)}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  )
}
