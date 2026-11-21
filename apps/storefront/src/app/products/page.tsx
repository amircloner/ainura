import { CatalogPage } from "@/components/catalog/catalog-page"
import { getCatalog } from "@/lib/medusa"

export const metadata = { title: "همه محصولات" }

export default async function ProductsPage() {
  return <CatalogPage title="همه محصولات" products={await getCatalog()} />
}
