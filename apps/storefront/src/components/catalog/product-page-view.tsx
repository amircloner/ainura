import { notFound } from "next/navigation"
import { categoryTrail, productCategories } from "@/components/catalog/catalog"
import { ProductRail } from "@/components/catalog/product-card"
import { ProductDetail } from "@/components/catalog/product-detail"
import { Reviews } from "@/components/catalog/reviews"
import { Breadcrumbs } from "@/components/layout/ui"
import { getCatalog, getProduct, getReviews } from "@/lib/medusa"

export async function ProductPageView({ handle }: { handle: string }) {
  const product = await getProduct(handle)
  if (!product) notFound()

  const [{ reviews, stats }, products] = await Promise.all([
    getReviews(product.id),
    getCatalog(),
  ])

  const byId = new Map(products.map((item) => [item.id, item]))
  const explicitRecs = (product.metadata.recommended_product_ids ?? [])
    .map((id) => byId.get(id))
    .filter((item): item is NonNullable<typeof item> =>
      Boolean(item && item.id !== product.id)
    )

  const productCategoryHandles = new Set(
    productCategories(product).map((item) => item.handle)
  )
  const productTagHandles = new Set(
    (product.tags ?? []).map((tag) => tag.handle)
  )

  const fallbackRelated = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (productCategories(item).some((cat) =>
          productCategoryHandles.has(cat.handle)
        ) ||
          (item.tags ?? []).some((tag) => productTagHandles.has(tag.handle)) ||
          (product.brand && item.brand?.id === product.brand.id))
    )
    .slice(0, 12)

  const related = [
    ...new Map(
      [...explicitRecs, ...fallbackRelated].map((item) => [item.id, item])
    ).values(),
  ].slice(0, 12)

  const crumbs = categoryTrail(product.category).map((category) => ({
    label: category.name,
    href: `/categories/${encodeURIComponent(category.handle)}`,
  }))

  return (
    <main className="ds-product-page">
      <div className="ds-pdp-wrap">
        <Breadcrumbs items={crumbs} homeLabel="دیجی‌استایل" />
        <ProductDetail key={product.id} product={product} stats={stats} />
      </div>

      {related.length > 0 && (
        <section id="related" aria-label="کالاهای مشابه">
          <ProductRail title="کالاهای مشابه" products={related} />
        </section>
      )}
      <div className="ds-pdp-wrap">
        <section className="ds-pdp-section" id="reviews">
          <h2>{stats.total_count ? "امتیاز و دیدگاه کاربران" : "دیدگاه‌ها"}</h2>
          <Reviews
            key={product.id}
            productId={product.id}
            productHandle={product.handle}
            demo={product.demo}
            reviews={reviews}
            stats={stats}
          />
        </section>
      </div>
    </main>
  )
}
