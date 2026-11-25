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
    <main>
      <div className="ds-pdp-wrap">
        <Breadcrumbs items={[...crumbs, { label: product.title }]} />
        <ProductDetail product={product} stats={stats} />

        <nav className="ds-pdp-tabs-bar" aria-label="بخش‌های صفحه محصول">
          <a href="#review">نقد و بررسی</a>
          <a href="#specifications">مشخصات محصول</a>
          <a href="#reviews">دیدگاه و امتیاز کاربران</a>
          {related.length > 0 && <a href="#related">کالاهای مشابه</a>}
        </nav>

        {product.description && (
          <section className="ds-pdp-section" id="review">
            <h2>نقد و بررسی</h2>
            <p className="ds-pdp-desc">{product.description}</p>
          </section>
        )}

        <section className="ds-pdp-section" id="specifications">
          <h2>مشخصات محصول</h2>
          {product.metadata.specifications?.length ? (
            <dl className="ds-specs-table">
              {product.metadata.specifications.map(({ label, value }, index) => (
                <div className="ds-specs-row" key={index}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="store-muted">
              مشخصات تکمیلی برای این محصول درج نشده است.
            </p>
          )}
        </section>

        <section className="ds-pdp-section" id="reviews">
          <h2>دیدگاه و امتیاز کاربران</h2>
          <Reviews
            productId={product.id}
            productHandle={product.handle}
            demo={product.demo}
            reviews={reviews}
            stats={stats}
          />
        </section>
      </div>

      {related.length > 0 && (
        <div id="related" style={{ paddingBottom: 24 }}>
          <ProductRail title="کالاهای مشابه" products={related} />
        </div>
      )}
    </main>
  )
}
