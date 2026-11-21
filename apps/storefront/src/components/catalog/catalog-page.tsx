import { Suspense } from "react"
import type { CatalogProduct } from "@/lib/medusa"
import { Breadcrumbs, Media } from "../layout/ui"
import { CatalogList } from "./catalog-list"

export function CatalogPage({
  title,
  description,
  image,
  crumbs = [{ label: title }],
  products,
}: {
  title: string
  description?: string | null
  image?: string | null
  crumbs?: { label: string; href?: string }[]
  products: CatalogProduct[]
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
        {image && <Media src={image} alt="" eager />}
      </div>
      <Suspense fallback={<p role="status">در حال بارگذاری محصولات…</p>}>
        <CatalogList products={products} />
      </Suspense>
    </main>
  )
}
