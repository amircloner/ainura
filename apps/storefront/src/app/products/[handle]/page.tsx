import { notFound } from "next/navigation"
import { categoryTrail } from "@/components/catalog/catalog"
import { ProductRail } from "@/components/catalog/product-card"
import { ProductDetail } from "@/components/catalog/product-detail"
import { Reviews } from "@/components/catalog/reviews"
import { Breadcrumbs } from "@/components/layout/ui"
import { getCatalog, getProduct, getReviews } from "@/lib/medusa"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()
  const [{ reviews, stats }, products] = await Promise.all([
    getReviews(product.id),
    getCatalog(),
  ])
  const related = products
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.category.handle === product.category.handle ||
          (product.brand && item.brand?.id === product.brand.id))
    )
    .slice(0, 12)
  const crumbs = categoryTrail(product.category).map((category) => ({
    label: category.name,
    href: `/categories/${encodeURIComponent(category.handle)}`,
  }))

  return (
    <main className="store-wrap store-page store-product-page">
      <Breadcrumbs items={[...crumbs, { label: product.title }]} />
      <ProductDetail product={product} stats={stats} />
      <nav className="store-section-nav" aria-label="بخش‌های صفحه محصول">
        <a href="#specifications">مشخصات و ویژگی‌ها</a>
        <a href="#reviews">دیدگاه و امتیاز کاربران</a>
        {related.length > 0 && <a href="#related">محصولات مشابه</a>}
      </nav>
      <section className="store-pdp-section" id="specifications">
        <h2>مشخصات و ویژگی‌ها</h2>
        {product.description && <p>{product.description}</p>}
        {product.metadata.specifications?.length ? (
          <dl className="store-spec-grid">
            {product.metadata.specifications.map(({ label, value }, index) => (
              <div key={index}>
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
      <section className="store-pdp-section" id="reviews">
        <h2>دیدگاه و امتیاز کاربران</h2>
        <Reviews
          productId={product.id}
          productHandle={product.handle}
          demo={product.demo}
          reviews={reviews}
          stats={stats}
        />
      </section>
      {related.length > 0 && (
        <div className="store-pdp-section" id="related">
          <ProductRail title="محصولات مشابه" products={related} />
        </div>
      )}
    </main>
  )
}
