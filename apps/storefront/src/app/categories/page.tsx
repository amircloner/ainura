import Link from "next/link"
import {
  categoriesFrom,
  productCategories,
} from "@/components/catalog/catalog"
import { Breadcrumbs, Media } from "@/components/layout/ui"
import { toPersian } from "@/lib/format"
import { getCatalog, getCategories } from "@/lib/medusa"

export default async function CategoriesIndexPage() {
  const [products, dbCategories] = await Promise.all([
    getCatalog(),
    getCategories(),
  ])

  const allCategories = [
    ...new Map(
      [...categoriesFrom(products), ...dbCategories].map((item) => [
        item.handle,
        item,
      ])
    ).values(),
  ].filter((cat) => cat.handle !== "all")

  const countFor = (handle: string) =>
    products.filter((product) =>
      productCategories(product).some((cat) => cat.handle === handle)
    ).length

  const topLevel = allCategories.filter((cat) => !cat.parent)
  const list = topLevel.length > 0 ? topLevel : allCategories

  return (
    <main className="store-wrap store-page">
      <Breadcrumbs
        items={[
          { label: "همه محصولات", href: "/products" },
          { label: "دسته‌بندی‌ها" },
        ]}
      />
      <div className="store-catalog-intro">
        <div>
          <p className="store-overline">فروشگاه آینورا</p>
          <h1>دسته‌بندی محصولات</h1>
        </div>
      </div>
      <div className="store-subcategories-grid">
        {list.map((category) => {
          const children = allCategories.filter(
            (child) => child.parent?.handle === category.handle
          )
          return (
            <div key={category.handle} className="store-subcategory-card">
              <Link
                href={`/categories/${encodeURIComponent(category.handle)}`}
                className="store-subcategory-link"
              >
                <div className="store-subcategory-thumb">
                  {category.thumbnail ? (
                    <Media src={category.thumbnail} alt={category.name} />
                  ) : (
                    <span>{category.name.slice(0, 1)}</span>
                  )}
                </div>
                <div className="store-subcategory-info">
                  <strong>{category.name}</strong>
                  {category.description && (
                    <p className="store-muted">{category.description}</p>
                  )}
                  <small>{toPersian(countFor(category.handle))} کالا</small>
                </div>
              </Link>
              {children.length > 0 && (
                <div className="store-subcategory-children">
                  {children.map((child) => (
                    <Link
                      key={child.handle}
                      href={`/categories/${encodeURIComponent(child.handle)}`}
                    >
                      {child.name} ({toPersian(countFor(child.handle))})
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}
