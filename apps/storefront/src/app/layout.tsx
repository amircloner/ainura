import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"
import { CartDrawer, CommerceNotice } from "@/components/commerce/cart"
import { CommerceProvider } from "@/lib/commerce"
import { getBrands, getCatalog } from "@/lib/medusa"
import "./globals.css"
import "./commerce.css"

export const revalidate = 60

export const metadata: Metadata = {
  title: {
    default: "آینورا | پوشاک، چرم و سبک زندگی",
    template: "%s | آینورا",
  },
  description: "آینورا، فروشگاه مد، پوشاک و چرم برای انتخاب‌های هر روز شما.",
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const [products, brands] = await Promise.all([getCatalog(), getBrands()])
  return (
    <html lang="fa" dir="rtl">
      <body>
        <CommerceProvider catalog={products}>
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
