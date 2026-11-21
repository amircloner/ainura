import { notFound } from "next/navigation"
import { CatalogPage } from "@/components/catalog/catalog-page"
import { getBrands, getCatalog } from "@/lib/medusa"

export default async function BrandPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const [{ handle: rawHandle }, brands, products] = await Promise.all([
    params,
    getBrands(),
    getCatalog(),
  ])
  const handle = decodeURIComponent(rawHandle).toLowerCase()
  const brand =
    brands.find((item) => item.handle.toLowerCase() === handle) ??
    products.find((product) => product.brand?.handle.toLowerCase() === handle)
      ?.brand

  if (!brand) notFound()

  const matched = products.filter(
    (product) =>
      product.brand?.handle.toLowerCase() === brand.handle.toLowerCase()
  )

  return (
    <CatalogPage
      title={brand.name}
      description={brand.description ?? undefined}
      image={brand.banner_url ?? brand.logo_url}
      crumbs={[
        { label: "همه محصولات", href: "/products" },
        { label: brand.name },
      ]}
      products={matched}
    />
  )
}
