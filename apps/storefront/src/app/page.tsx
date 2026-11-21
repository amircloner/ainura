import Link from "next/link"
import {
  categoriesFrom,
  categoryTrail,
  matchesText,
  variantDiscount,
} from "@/components/catalog/catalog"
import { Countdown, Hero } from "@/components/catalog/home-interactions"
import { ProductRail } from "@/components/catalog/product-card"
import { Icon, Media } from "@/components/layout/ui"
import { getBrands, getCatalog } from "@/lib/medusa"

const QUICK_CATEGORIES = [
  { label: "زنانه", terms: ["women", "زنانه"] },
  { label: "مردانه", terms: ["men", "مردانه"] },
  { label: "بچگانه", terms: ["kids", "بچگانه", "کودک"] },
  { label: "کیف و کفش", terms: ["shoe", "bag", "کیف", "کفش"] },
  { label: "اکسسوری", terms: ["accessor", "اکسسوری"] },
  { label: "زیبایی", terms: ["beauty", "زیبایی"] },
]

export default async function HomePage() {
  const [products, brands] = await Promise.all([getCatalog(), getBrands()])
  const categories = categoriesFrom(products)
  const tiles = QUICK_CATEGORIES.map(({ label, terms }) => {
    const matches = categories.filter((category) =>
      terms.some(
        (term) =>
          matchesText(term, category.name) ||
          category.handle.split(/[-_]/).some((part) => part.startsWith(term))
      )
    )
    const top = matches.filter(
      (category) =>
        !categoryTrail(category)
          .slice(0, -1)
          .some((parent) =>
            matches.some((item) => item.handle === parent.handle)
          )
    )
    const href =
      top.length === 1
        ? `/categories/${encodeURIComponent(top[0].handle)}`
        : `/products?${new URLSearchParams(top.length ? top.map((category) => ["category", category.handle]) : [["q", label]])}`
    const image = products.find(
      (product) =>
        product.images.length &&
        categoryTrail(product.category).some((category) =>
          top.some((item) => item.handle === category.handle)
        )
    )?.images[0]
    return { label, href, image }
  })

  const newest = [...products].sort(
    (a, b) =>
      (Date.parse(b.created_at ?? "") || 0) -
      (Date.parse(a.created_at ?? "") || 0)
  )
  const sales = products.filter((product) =>
    product.variants.some(
      (variant) => variant.available && variantDiscount(variant)
    )
  )
  const best = products.filter((product) => product.bestSeller)
  const featured = brands.filter((brand) => brand.is_featured)
  const slides = [
    {
      eyebrow: "منتخب آینورا",
      title: "وقتی سادگی، استایل است",
      description:
        "پوشاک و چرم برای هر روز؛ انتخاب‌هایی که به استایل شما می‌آیند.",
      href: "/products",
      image: (
        products.find((product) => product.featured && product.images.length) ??
        products.find((product) => product.images.length)
      )?.images[0],
    },
    {
      eyebrow: "جزئیات ماندگار",
      title: "یک قدم تازه",
      description: "از کفش روزمره تا کیف‌های چرمی، همراه لحظه‌های شما.",
      href: tiles[3].href,
      image: tiles[3].image,
    },
    {
      eyebrow: "تازه‌های فروشگاه",
      title: "برای روزهای پیش رو",
      description:
        "تازه‌رسیده‌ها را ببینید و برای روزهای بعد، انتخاب تازه‌ای داشته باشید.",
      href: "/products?sort=new",
      image: newest.find((product) => product.images.length)?.images[0],
    },
  ]

  return (
    <main>
      <Hero slides={slides} />
      <div className="store-wrap store-home-content">
        <section className="store-section">
          <div className="store-section-heading">
            <h2>خرید بر اساس دسته‌بندی</h2>
          </div>
          <div className="store-category-tiles">
            {tiles.map((tile) => (
              <Link key={tile.label} href={tile.href}>
                <Media src={tile.image} alt="" />
                <span>
                  {tile.label}
                  <Icon name="left" size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <div className="store-flash">
          {sales.length ? (
            <>
              <Countdown />
              <ProductRail
                title="فروش ویژه شگفت‌انگیز"
                products={sales.slice(0, 12)}
                href="/products?sale=1&stock=1&sort=discount"
                highlightDiscount
              />
            </>
          ) : (
            <p>در حال حاضر پیشنهاد ویژه‌ای موجود نیست.</p>
          )}
        </div>
        {brands.length > 0 && (
          <section className="store-section">
            <div className="store-section-heading">
              <h2>برندهای برگزیده</h2>
            </div>
            <div className="store-brand-tiles">
              {(featured.length ? featured : brands).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${encodeURIComponent(brand.handle)}`}
                >
                  {brand.logo_url && <Media src={brand.logo_url} alt="" />}
                  <span>{brand.name}</span>
                  <small dir="ltr" lang="en">
                    {brand.handle.replace(/-/g, " ")}
                  </small>
                </Link>
              ))}
            </div>
          </section>
        )}
        <ProductRail
          title="تازه‌رسیده‌ها"
          products={newest.slice(0, 12)}
          href="/products?sort=new"
          badge="جدید"
        />
        <ProductRail
          title="پرفروش‌ترین‌ها"
          products={best.slice(0, 12)}
          href="/products?sort=bestsellers"
          badge="پرفروش"
        />
      </div>
    </main>
  )
}
