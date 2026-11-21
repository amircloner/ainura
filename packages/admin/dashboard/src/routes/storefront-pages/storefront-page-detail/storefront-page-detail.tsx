import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { HttpTypes } from "@medusajs/types"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { PermissionGuard } from "../../../components/common/permission-guard"
import { LayoutComposer } from "../../../components/layout-composer"
import {
  useDeleteStorefrontPage,
  useDeleteStorefrontSection,
  useReorderStorefrontSections,
  useStorefrontPage,
  useUpdateStorefrontPage,
  useUpdateStorefrontSection,
} from "../../../hooks/api/storefront-pages"
import { SECTION_TYPE_LABELS, SectionEditorDrawer } from "../section-editor"

const StorefrontPageDetailContent = () => {
  const { id } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const prompt = usePrompt()

  const { storefront_page: page, isPending, isError, error } =
    useStorefrontPage(id!)
  const updatePage = useUpdateStorefrontPage(id!)
  const deletePage = useDeleteStorefrontPage(id!)
  const updateSection = useUpdateStorefrontSection(id!)
  const deleteSection = useDeleteStorefrontSection(id!)
  const reorderSections = useReorderStorefrontSections(id!)

  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [slug, setSlug] = useState("")
  const [isActive, setIsActive] = useState(true)
  const [editingSection, setEditingSection] = useState<
    HttpTypes.AdminStorefrontSection | null | undefined
  >(undefined)

  useEffect(() => {
    if (page) {
      setTitle(page.title)
      setSubtitle(page.subtitle ?? "")
      setSlug(page.slug)
      setIsActive(page.is_active)
    }
  }, [page])

  if (isError) {
    throw error
  }

  if (isPending || !page) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          {t("storefrontPages.loading")}
        </Text>
      </Container>
    )
  }

  const sections = [...(page.sections ?? [])].sort((a, b) => a.rank - b.rank)

  const handleSaveMeta = () => {
    updatePage.mutate(
      {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        slug: slug.trim().toLowerCase(),
        is_active: isActive,
      },
      {
        onSuccess: () => toast.success(t("storefrontPages.updated")),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  const handleDeletePage = async () => {
    const ok = await prompt({
      title: t("general.areYouSure"),
      description: `Delete page "${page.title}" and all its sections?`,
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })
    if (!ok) return
    deletePage.mutate(undefined, {
      onSuccess: () => {
        toast.success(t("storefrontPages.deleted"))
        navigate("/storefront-pages")
      },
      onError: (err) => toast.error(err.message),
    })
  }

  const moveSection = (index: number, delta: -1 | 1) => {
    const target = index + delta
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)
    reorderSections.mutate(
      { section_ids: next.map((s) => s.id) },
      {
        onSuccess: () => toast.success(t("storefrontPages.reordered")),
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Heading>{page.title}</Heading>
            <Text size="xsmall" className="text-ui-fg-subtle">
              /{page.page_type === "home" ? "" : `landings/${page.slug}`}
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <PermissionGuard permission="storefront_page:update">
              <Button
                size="small"
                isLoading={updatePage.isPending}
                onClick={handleSaveMeta}
              >
                {t("actions.save")}
              </Button>
            </PermissionGuard>
            <PermissionGuard permission="storefront_page:delete">
              <Button
                size="small"
                variant="danger"
                isLoading={deletePage.isPending}
                onClick={handleDeletePage}
              >
                {t("actions.delete")}
              </Button>
            </PermissionGuard>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <Label size="small">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label size="small">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <Label size="small">Subtitle</Label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="flex items-end justify-between pb-2">
            <Label size="small">Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </div>
      </Container>

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h2">
              {t("storefrontPages.sections")} ({sections.length})
            </Heading>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Order sections top-to-bottom as rendered on the storefront.
            </Text>
          </div>
          <PermissionGuard permission="storefront_page:update">
            <Button
              size="small"
              variant="secondary"
              onClick={() => setEditingSection(null)}
            >
              + {t("storefrontPages.addSection")}
            </Button>
          </PermissionGuard>
        </div>

        {!sections.length ? (
          <Text size="small" className="text-ui-fg-subtle px-6 py-8">
            No sections yet. Click &ldquo;Add Section&rdquo; to build this page.
          </Text>
        ) : (
          <ul className="divide-y">
            {sections.map((section, index) => (
              <li
                key={section.id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge size="2xsmall" color="grey">
                      #{index + 1}
                    </Badge>
                    <Text size="small" weight="plus">
                      {section.title || SECTION_TYPE_LABELS[section.type]}
                    </Text>
                    <Badge size="2xsmall" color="blue">
                      {SECTION_TYPE_LABELS[section.type]}
                    </Badge>
                  </div>
                  {section.href && (
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {section.href}
                    </Text>
                  )}
                </div>

                <PermissionGuard permission="storefront_page:update">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={section.is_active}
                      onCheckedChange={(checked) =>
                        updateSection.mutate({
                          sectionId: section.id,
                          payload: { is_active: checked },
                        })
                      }
                    />
                    <Button
                      size="small"
                      variant="secondary"
                      disabled={index === 0 || reorderSections.isPending}
                      onClick={() => moveSection(index, -1)}
                    >
                      ↑
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      disabled={
                        index === sections.length - 1 ||
                        reorderSections.isPending
                      }
                      onClick={() => moveSection(index, 1)}
                    >
                      ↓
                    </Button>
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => setEditingSection(section)}
                    >
                      {t("actions.edit")}
                    </Button>
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() =>
                        deleteSection.mutate(section.id, {
                          onSuccess: () =>
                            toast.success(t("storefrontPages.sectionDeleted")),
                          onError: (err) => toast.error(err.message),
                        })
                      }
                    >
                      {t("actions.delete")}
                    </Button>
                  </div>
                </PermissionGuard>
              </li>
            ))}
          </ul>
        )}
      </Container>

      {editingSection !== undefined && (
        <SectionEditorDrawer
          key={editingSection?.id ?? "new"}
          pageId={page.id}
          section={editingSection}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingSection(undefined)
          }}
        />
      )}
    </div>
  )
}

export const StorefrontPageDetail = () => (
  <LayoutComposer
    widgetsZonePrefix="storefront_page.details"
    preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
    disableWidgets
    sections={{
      main: (
        <LayoutComposer.Entry id="StorefrontPageDetailContent">
          <StorefrontPageDetailContent />
        </LayoutComposer.Entry>
      ),
    }}
  />
)
