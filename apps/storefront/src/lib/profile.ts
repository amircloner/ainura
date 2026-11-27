import type { HttpTypes } from "@medusajs/types"
import { latinDigits, toPersian } from "./format.ts"

export type OrderStatusBucket =
  "all" | "in_progress" | "sent" | "returned" | "cancelled"

export type ProfileOrderStats = {
  in_progress: number
  sent: number
  cancelled: number
  returned: number
}

export const ORDER_TABS: { type: OrderStatusBucket; title: string }[] = [
  { type: "all", title: "همه سفارش‌ها" },
  { type: "in_progress", title: "در حال پردازش" },
  { type: "sent", title: "ارسال و تحویل" },
  { type: "returned", title: "مرجوعی" },
  { type: "cancelled", title: "لغو شده" },
]

export const ORDER_EMPTY_TITLES: Record<OrderStatusBucket, string> = {
  all: "هنوز سفارشی ثبت نکرده‌اید.",
  in_progress: "سفارشی در حال پردازش ندارید.",
  sent: "سفارش ارسال یا تحویل‌شده‌ای ندارید.",
  returned: "سفارش مرجوعی ندارید.",
  cancelled: "سفارش لغوشده‌ای ندارید.",
}

type OrderLike = {
  status?: string | null
  fulfillment_status?: string | null
  payment_status?: string | null
}

export function classifyOrderStatus(
  order: OrderLike
): Exclude<OrderStatusBucket, "all"> {
  const status = String(order.status ?? "").toLowerCase()
  const fulfillment = String(order.fulfillment_status ?? "").toLowerCase()
  const payment = String(order.payment_status ?? "").toLowerCase()

  if (
    status === "canceled" ||
    status === "cancelled" ||
    fulfillment === "canceled"
  )
    return "cancelled"
  if (
    status === "returned" ||
    payment === "refunded" ||
    payment === "partially_refunded" ||
    fulfillment === "returned" ||
    fulfillment === "partially_returned"
  )
    return "returned"
  if (
    status === "completed" ||
    fulfillment === "delivered" ||
    fulfillment === "shipped"
  )
    return "sent"
  return "in_progress"
}

export function orderStatusLabel(order: OrderLike): string {
  const bucket = classifyOrderStatus(order)
  if (bucket === "cancelled") return "لغو شده"
  if (bucket === "returned") return "مرجوع شده"
  if (bucket === "sent") {
    if (order.fulfillment_status === "delivered") return "تحویل شده"
    if (order.fulfillment_status === "shipped") return "ارسال شده"
    return "تکمیل شده"
  }
  if (order.fulfillment_status === "partially_shipped") return "بخشی ارسال شده"
  if (order.fulfillment_status === "partially_delivered")
    return "بخشی تحویل شده"
  const payment = String(order.payment_status ?? "").toLowerCase()
  if (payment === "not_paid" || payment === "awaiting")
    return "در انتظار پرداخت"
  return "در حال پردازش"
}

export function computeOrderStats(orders: OrderLike[]): ProfileOrderStats {
  const stats: ProfileOrderStats = {
    in_progress: 0,
    sent: 0,
    cancelled: 0,
    returned: 0,
  }
  for (const order of orders) stats[classifyOrderStatus(order)] += 1
  return stats
}

export function customerDisplayName(
  customer: Pick<
    HttpTypes.StoreCustomer,
    "first_name" | "last_name" | "phone" | "email"
  >
): string {
  const full = [customer.first_name, customer.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
  if (full) return full
  if (customer.phone) return formatPersianPhone(customer.phone)
  if (customer.email && !customer.email.endsWith("@phone.invalid"))
    return customer.email
  return "مشتری آینورا"
}

export function formatPersianPhone(phone?: string | null): string {
  if (!phone) return ""
  const digits = latinDigits(phone).replace(/[^\d+]/g, "")
  const local = digits.startsWith("+98")
    ? `0${digits.slice(3)}`
    : digits.startsWith("98") && digits.length === 12
      ? `0${digits.slice(2)}`
      : digits
  return toPersian(local)
}

export function formatPersianDate(input?: string | Date | null): string {
  if (!input) return ""
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}

export type ProfileSection =
  | "overview"
  | "orders"
  | "favorites"
  | "comments"
  | "addresses"
  | "wallet"
  | "gift-card"
  | "personal-info"

export type ProfileNavItem = {
  id: Exclude<ProfileSection, "overview">
  label: string
  href: string
}

export const PROFILE_NAV_ITEMS: ProfileNavItem[] = [
  { id: "orders", label: "سفارش‌ها", href: "/profile/orders" },
  {
    id: "favorites",
    label: "علاقه‌مندی‌ها",
    href: "/profile/favorites",
  },
  { id: "comments", label: "دیدگاه‌ها", href: "/profile/comments" },
  { id: "addresses", label: "نشانی‌ها", href: "/profile/addresses" },
  { id: "wallet", label: "اعتبار فروشگاه", href: "/profile/wallet" },
  { id: "gift-card", label: "کارت هدیه", href: "/profile/gift-card" },
  { id: "personal-info", label: "اطلاعات من", href: "/profile/personal-info" },
]

export function isProfileSection(
  value?: string | null
): value is Exclude<ProfileSection, "overview"> {
  return PROFILE_NAV_ITEMS.some((item) => item.id === value)
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())
}
