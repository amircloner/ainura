import type { Metadata } from "next"
import { ProductPageView } from "@/components/catalog/product-page-view"
import { getProduct } from "@/lib/medusa"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  return product
    ? { title: product.title, description: product.description }
    : { title: "محصول" }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  return <ProductPageView handle={handle} />
}
