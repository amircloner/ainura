import Link from "next/link"
import { tagsFrom } from "@/components/catalog/catalog"
import { Breadcrumbs } from "@/components/layout/ui"
import { toPersian } from "@/lib/format"
import { getCatalog, getTags } from "@/lib/medusa"

export default async function TagsIndexPage() {
  const [products, dbTags] = await Promise.all([getCatalog(), getTags()])

  const allTags = [
    ...new Map(
      [...tagsFrom(products), ...dbTags].map((tag) => [tag.handle, tag])
    ).values(),
  ].sort((a, b) => a.value.localeCompare(b.value, "fa"))

  const countFor = (handle: string, value: string) =>
    products.filter((product) =>
      (product.tags ?? []).some(
        (item) => item.handle === handle || item.value === value
      )
    ).length

  return (
    <main className="store-wrap store-page">
      <Breadcrumbs
        items={[
          { label: "همه محصولات", href: "/products" },
          { label: "برچسب‌ها" },
        ]}
      />
      <div className="store-catalog-intro">
        <div>
          <p className="store-overline">فروشگاه آینورا</p>
          <h1>برچسب‌های محصولات</h1>
        </div>
      </div>
      {allTags.length > 0 ? (
        <div className="store-tag-cloud">
          {allTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${encodeURIComponent(tag.handle)}`}
              className="store-tag-pill"
              title={tag.description || tag.value}
            >
              <span>#{tag.value}</span>
              <small>({toPersian(countFor(tag.handle, tag.value))})</small>
            </Link>
          ))}
        </div>
      ) : (
        <p className="store-muted">هنوز برچسبی ثبت نشده است.</p>
      )}
    </main>
  )
}
