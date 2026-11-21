import { notFound } from "next/navigation"
import { categoriesFrom, categoryTrail } from "@/components/catalog/catalog"
import { CatalogPage } from "@/components/catalog/catalog-page"
import { getCatalog } from "@/lib/medusa"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const [{ handle: rawHandle }, products] = await Promise.all([
    params,
    getCatalog(),
  ])
  const handle = decodeURIComponent(rawHandle)
  const category = categoriesFrom(products).find(
    (item) => item.handle === handle
  )
  if (!category) notFound()

  const matched = products.filter((product) =>
    categoryTrail(product.category).some((item) => item.handle === handle)
  )

  const crumbs = [
    { label: "همه محصولات", href: "/products" },
    ...categoryTrail(category).map((item) => ({
      label: item.name,
      href:
        item.handle === handle
          ? undefined
          : `/categories/${encodeURIComponent(item.handle)}`,
    })),
  ]

  return (
    <CatalogPage title={category.name} crumbs={crumbs} products={matched} />
  )
}
