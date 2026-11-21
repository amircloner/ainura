import { CartContents } from "@/components/commerce/cart"

export const metadata = { title: "سبد خرید" }

export default function CartPage() {
  return (
    <main className="commerce-page">
      <h1>سبد خرید</h1>
      <CartContents />
    </main>
  )
}
