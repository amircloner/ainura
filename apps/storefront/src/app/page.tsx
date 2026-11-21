import { StorefrontSectionRenderer } from "@/components/catalog/storefront-section-renderer"
import { getStorefrontPage } from "@/lib/medusa"

export default async function HomePage() {
  const page = await getStorefrontPage("home")

  if (!page || !page.sections.length) {
    return (
      <main className="ds-section ds-pad-x" style={{ paddingBlock: 72 }}>
        <div
          style={{
            border: "1px solid var(--ds-neutral-150)",
            padding: 32,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            محتوای صفحه اصلی در دیتابیس یافت نشد
          </h1>
          <p style={{ fontSize: 13, color: "var(--ds-grey-400)" }}>
            اتصال به سرور Medusa را بررسی کنید و اسکریپت seed یا بخش Storefront
            Pages در پنل ادمین را تنظیم نمایید.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main>
      <StorefrontSectionRenderer sections={page.sections} />
    </main>
  )
}
