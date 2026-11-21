import { notFound } from "next/navigation"
import { CatalogPage } from "@/components/catalog/catalog-page"
import { getBrands, getCatalog } from "@/lib/medusa"

export default async function BrandPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const [{ handle }, brands, products] = await Promise.all([
    params,
    getBrands(),
    getCatalog(),
  ])
  const brand =
    brands.find((item) => item.handle === handle) ??
    products.find((product) => product.brand?.handle === handle)?.brand
  if (!brand) notFound()
  return (
    <CatalogPage
      title={brand.name}
      description={brand.description}
      image={brand.banner_url ?? brand.logo_url}
      crumbs={[
        { label: "همه محصولات", href: "/products" },
        { label: brand.name },
      ]}
      products={products.filter((product) => product.brand?.handle === handle)}
    />
  )
}
