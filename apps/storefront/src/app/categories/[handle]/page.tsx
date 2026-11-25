import { notFound } from "next/navigation"
import {
  categoriesFrom,
  categoryTrail,
  productCategories,
} from "@/components/catalog/catalog"
import { CatalogPage } from "@/components/catalog/catalog-page"
import { getCatalog, getCategories } from "@/lib/medusa"

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const [{ handle: rawHandle }, products, dbCategories] = await Promise.all([
    params,
    getCatalog(),
    getCategories(),
  ])
  const handle = decodeURIComponent(rawHandle)

  const allCategories = [
    ...new Map(
      [...categoriesFrom(products), ...dbCategories].map((item) => [
        item.handle,
        item,
      ])
    ).values(),
  ]
  const category = allCategories.find((item) => item.handle === handle)
  if (!category) notFound()

  const matched = products.filter((product) =>
    productCategories(product).some((item) => item.handle === handle)
  )

  const directChildren = allCategories
    .filter((item) => item.parent?.handle === handle)
    .map((sub) => ({
      ...sub,
      count: products.filter((product) =>
        productCategories(product).some((cat) => cat.handle === sub.handle)
      ).length,
    }))

  const displayType = category.display_type ?? "default"
  const showSubcategories =
    displayType === "subcategories" ||
    displayType === "both" ||
    (displayType === "default" && directChildren.length > 0)
  const showProducts =
    displayType === "products" ||
    displayType === "both" ||
    displayType === "default" ||
    directChildren.length === 0

  const crumbs = [
    { label: "همه محصولات", href: "/products" },
    { label: "دسته‌بندی‌ها", href: "/categories" },
    ...categoryTrail(category).map((item) => ({
      label: item.name,
      href:
        item.handle === handle
          ? undefined
          : `/categories/${encodeURIComponent(item.handle)}`,
    })),
  ]

  return (
    <CatalogPage
      title={category.name}
      description={category.description}
      image={category.thumbnail}
      crumbs={crumbs}
      products={matched}
      subcategories={showSubcategories ? directChildren : undefined}
      showProducts={showProducts}
    />
  )
}
