import type { Metadata } from "next"
import { ProductPageView } from "@/components/catalog/product-page-view"
import { getProduct } from "@/lib/medusa"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  return product
    ? { title: product.title, description: product.description }
    : { title: "محصول" }
}

export default async function DigistyleProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <ProductPageView handle={slug} />
}
