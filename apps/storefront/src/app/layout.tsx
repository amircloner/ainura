import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { CartDrawer, CommerceNotice } from "@/components/commerce/cart"
import { CommerceProvider } from "@/lib/commerce"
import {
  getBrands,
  getCatalog,
  getStorefrontColors,
} from "@/lib/medusa"
import "./globals.css"
import "./commerce.css"
import "./digistyle.css"

export const revalidate = 60

export const metadata: Metadata = {
  title: {
    default: "فروشگاه اینترنتی مد و لباس دیجی‌استایل",
    template: "%s | دیجی‌استایل",
  },
  description:
    "خرید اینترنتی جدیدترین مدل‌های لباس زنانه، مردانه و بچگانه، کیف و کفش، ساعت، اکسسوری و لوازم آرایشی با ضمانت اصالت کالا در دیجی‌استایل.",
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const [products, brands, colorMap] = await Promise.all([
    getCatalog(),
    getBrands(),
    getStorefrontColors(),
  ])
  return (
    <html
      lang="fa"
      dir="rtl"
      data-dds-style="sharp"
      data-dds-theme="fashion"
      data-dds-mode="light"
    >
      <body>
        <CommerceProvider catalog={products} colorMap={colorMap}>
          <Header products={products} brands={brands} />
          {children}
          <Footer />
          <CartDrawer />
          <CommerceNotice />
        </CommerceProvider>
      </body>
    </html>
  )
}
