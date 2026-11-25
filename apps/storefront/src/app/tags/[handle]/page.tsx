import { notFound } from "next/navigation"
import { tagsFrom } from "@/components/catalog/catalog"
import { CatalogPage } from "@/components/catalog/catalog-page"
import { getCatalog, getTags } from "@/lib/medusa"

export default async function TagPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const [{ handle: rawHandle }, products, dbTags] = await Promise.all([
    params,
    getCatalog(),
    getTags(),
  ])
  const handle = decodeURIComponent(rawHandle)

  const allTags = [
    ...new Map(
      [...tagsFrom(products), ...dbTags].map((tag) => [tag.handle, tag])
    ).values(),
  ]
  const tag = allTags.find(
    (item) => item.handle === handle || item.value === handle || item.id === handle
  )
  if (!tag) notFound()

  const matched = products.filter((product) =>
    (product.tags ?? []).some(
      (item) =>
        item.id === tag.id ||
        item.handle === tag.handle ||
        item.value === tag.value
    )
  )

  const crumbs = [
    { label: "همه محصولات", href: "/products" },
    { label: "برچسب‌ها", href: "/tags" },
    { label: `#${tag.value}` },
  ]

  return (
    <CatalogPage
      title={`#${tag.value}`}
      description={tag.description}
      crumbs={crumbs}
      products={matched}
    />
  )
}
