import assert from "node:assert/strict"
import test from "node:test"
import {
  classifyOrderStatus,
  computeOrderStats,
  customerDisplayName,
  formatPersianPhone,
  isValidEmail,
  orderStatusLabel,
} from "../profile.ts"

test("order status filters and labels reflect Medusa order states", () => {
  const orders = [
    {
      status: "pending",
      fulfillment_status: "not_fulfilled",
      payment_status: "captured",
    },
    {
      status: "pending",
      fulfillment_status: "not_fulfilled",
      payment_status: "awaiting",
    },
    {
      status: "completed",
      fulfillment_status: "delivered",
      payment_status: "captured",
    },
    {
      status: "canceled",
      fulfillment_status: "canceled",
      payment_status: "not_paid",
    },
    {
      status: "pending",
      fulfillment_status: "returned",
      payment_status: "refunded",
    },
  ]
  assert.equal(classifyOrderStatus(orders[0]), "in_progress")
  assert.equal(orderStatusLabel(orders[1]), "در انتظار پرداخت")
  assert.equal(classifyOrderStatus(orders[2]), "sent")
  assert.equal(classifyOrderStatus(orders[3]), "cancelled")
  assert.equal(classifyOrderStatus(orders[4]), "returned")
  assert.equal(orderStatusLabel({ fulfillment_status: "shipped" }), "ارسال شده")
  assert.equal(
    orderStatusLabel({ fulfillment_status: "partially_delivered" }),
    "بخشی تحویل شده"
  )
  assert.deepEqual(computeOrderStats(orders), {
    in_progress: 2,
    sent: 1,
    cancelled: 1,
    returned: 1,
  })
})

test("formatPersianPhone and customerDisplayName format Iranian customer identity", () => {
  assert.equal(formatPersianPhone("+989123456789"), "۰۹۱۲۳۴۵۶۷۸۹")
  assert.equal(formatPersianPhone("09123456789"), "۰۹۱۲۳۴۵۶۷۸۹")
  assert.equal(
    customerDisplayName({
      first_name: "سارا",
      last_name: "احمدی",
      phone: "+989123456789",
      email: "989123456789@phone.invalid",
    }),
    "سارا احمدی"
  )
  assert.equal(
    customerDisplayName({
      first_name: null,
      last_name: null,
      phone: "+989123456789",
      email: "989123456789@phone.invalid",
    }),
    "۰۹۱۲۳۴۵۶۷۸۹"
  )
})

test("contact email validation accepts valid addresses and rejects incomplete ones", () => {
  assert.equal(isValidEmail("user@example.com"), true)
  assert.equal(isValidEmail("invalid-email"), false)
})
