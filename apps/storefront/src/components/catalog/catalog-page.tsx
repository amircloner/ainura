import Link from "next/link"
import { Suspense } from "react"
import { toPersian } from "@/lib/format"
import type { CatalogCategory, CatalogProduct } from "@/lib/medusa"
import { Breadcrumbs, Media } from "../layout/ui"
import { CatalogList } from "./catalog-list"

export type SubcategoryCard = CatalogCategory & { count: number }

export function CatalogPage({
  title,
  description,
  image,
  crumbs = [{ label: title }],
  products,
  subcategories,
  showProducts = true,
}: {
  title: string
  description?: string | null
  image?: string | null
  crumbs?: { label: string; href?: string }[]
  products: CatalogProduct[]
  subcategories?: SubcategoryCard[]
  showProducts?: boolean
}) {
  return (
    <main className="store-wrap store-page">
      <Breadcrumbs items={crumbs} />
      <div
        className={`store-catalog-intro${image ? " store-catalog-banner" : ""}`}
      >
        <div>
          <p className="store-overline">فروشگاه آینورا</p>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        {image && <Media src={image} alt={title} eager />}
      </div>
      {subcategories && subcategories.length > 0 && (
        <section
          className="store-subcategories-section"
          aria-label="زیردسته‌ها"
        >
          <div className="store-subcategories-grid">
            {subcategories.map((sub) => (
              <Link
                key={sub.handle}
                href={`/categories/${encodeURIComponent(sub.handle)}`}
                className="store-subcategory-card"
              >
                <div className="store-subcategory-thumb">
                  {sub.thumbnail ? (
                    <Media src={sub.thumbnail} alt={sub.name} />
                  ) : (
                    <span>{sub.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="store-subcategory-info">
                  <strong>{sub.name}</strong>
                  <small>{toPersian(sub.count)} کالا</small>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {showProducts && (
        <Suspense fallback={<p role="status">در حال بارگذاری محصولات…</p>}>
          <CatalogList products={products} />
        </Suspense>
      )}
    </main>
  )
}
