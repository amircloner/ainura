import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { StorefrontSectionRenderer } from "@/components/catalog/storefront-section-renderer"
import { Breadcrumbs } from "@/components/layout/ui"
import { getStorefrontPage } from "@/lib/medusa"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = await getStorefrontPage(slug)
  if (!page) return { title: "صفحه یافت نشد" }
  return {
    title: page.title,
    description: page.subtitle ?? `${page.title} در فروشگاه اینترنتی دیجی‌استایل`,
  }
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = await getStorefrontPage(slug)
  if (!page) notFound()

  const anchorSections = page.sections.filter(
    (s) =>
      (s.type === "simple_carousel" ||
        s.type === "tab_carousel" ||
        s.type === "amazing_carousel") &&
      s.title
  )

  return (
    <main>
      <div className="ds-landing-hero">
        <Breadcrumbs items={[{ label: page.title }]} />
        <div className="ds-landing-head">
          <div>
            <h1>{page.title}</h1>
            {page.subtitle && <p>{page.subtitle}</p>}
          </div>
        </div>
        {anchorSections.length > 1 && (
          <nav className="ds-landing-pills" aria-label={`بخش‌های ${page.title}`}>
            {anchorSections.map((section) => (
              <a
                key={section.id}
                href={`#section-${section.id}`}
                className="ds-landing-pill"
              >
                {section.title}
              </a>
            ))}
          </nav>
        )}
      </div>

      <div style={{ paddingTop: 20 }}>
        <StorefrontSectionRenderer sections={page.sections} />
      </div>
    </main>
  )
}
