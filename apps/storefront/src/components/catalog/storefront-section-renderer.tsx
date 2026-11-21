import type { DynamicStorefrontSection } from "@/lib/medusa"
import {
  AmazingSpecialCarousel,
  BrandMarqueeRow,
  CategoryImageRow,
  DigistyleHero,
  FourDBanner,
  TabCarousel,
  TrustBadgesRow,
  TwoBBanner,
} from "./digistyle-widgets"
import { ProductRail } from "./product-card"

export function StorefrontSectionRenderer({
  sections,
}: {
  sections: DynamicStorefrontSection[]
}) {
  return (
    <>
      {sections.map((section) => {
        const cfg = section.config ?? {}
        switch (section.type) {
          case "hero_banner": {
            const slides = (cfg.slides ?? []).map((s, idx) => ({
              id: idx,
              desktopImage: s.desktop_image,
              mobileImage: s.mobile_image || s.desktop_image,
              href: s.href || "/products",
              alt: s.alt || section.title || "بنر دیجی‌استایل",
            }))
            if (!slides.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <DigistyleHero slides={slides} />
              </div>
            )
          }

          case "category_row": {
            const items = (cfg.items ?? []).map((im) => ({
              title: im.title,
              image: im.image,
              href: im.href || "/products",
            }))
            if (!items.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <CategoryImageRow items={items} />
              </div>
            )
          }

          case "brand_marquee": {
            const items = (cfg.brand_items ?? []).map((b) => ({
              image: b.image,
              href: b.href || "/products",
            }))
            if (!items.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <BrandMarqueeRow
                  title={section.title || undefined}
                  items={items}
                  reverse={Boolean(cfg.reverse)}
                />
              </div>
            )
          }

          case "amazing_carousel": {
            const products = section.products ?? []
            if (!products.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <AmazingSpecialCarousel
                  title={section.title || "پیشنهادهای ویژه"}
                  href={section.href || "/products?sale=1&sort=discount"}
                  products={products}
                />
              </div>
            )
          }

          case "tab_carousel": {
            const tabs = (section.tabs ?? []).map((t) => ({
              title: t.title,
              href: t.href || section.href || "/products",
              products: t.products,
            }))
            if (!tabs.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <TabCarousel
                  title={section.title || ""}
                  tabs={tabs}
                />
              </div>
            )
          }

          case "simple_carousel": {
            const products = section.products ?? []
            if (!products.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <ProductRail
                  title={section.title || ""}
                  href={section.href || undefined}
                  products={products}
                />
              </div>
            )
          }

          case "two_banner": {
            const banners = (cfg.banners ?? []).map((b) => ({
              desktopImage: b.desktop_image,
              mobileImage: b.mobile_image || b.desktop_image,
              href: b.href || "/products",
              alt: b.alt || "",
            }))
            if (!banners.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <TwoBBanner banners={banners} />
              </div>
            )
          }

          case "four_banner": {
            const banners = (cfg.banners ?? []).map((b) => ({
              desktopImage: b.desktop_image,
              mobileImage: b.mobile_image || b.desktop_image,
              href: b.href || "/products",
              alt: b.alt || "",
            }))
            if (!banners.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <FourDBanner banners={banners} />
              </div>
            )
          }

          case "trust_badges": {
            const items = (cfg.items ?? []).map((im) => ({
              title: im.title,
              image: im.image,
            }))
            if (!items.length) return null
            return (
              <div key={section.id} id={`section-${section.id}`}>
                <TrustBadgesRow items={items} />
              </div>
            )
          }

          default:
            return null
        }
      })}
    </>
  )
}
