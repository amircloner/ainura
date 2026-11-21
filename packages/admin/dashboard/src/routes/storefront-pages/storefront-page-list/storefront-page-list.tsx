import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { PermissionGuard } from "../../../components/common/permission-guard"
import { LayoutComposer } from "../../../components/layout-composer"
import {
  useCreateStorefrontPage,
  useStorefrontPages,
} from "../../../hooks/api/storefront-pages"
import { useResourcePermissions } from "../../../hooks/use-resource-permissions"

const StorefrontPageListSection = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { canRead, isLoading } = useResourcePermissions("storefront_page")
  const [search, setSearch] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [slug, setSlug] = useState("")
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [pageType, setPageType] = useState<"home" | "landing">("landing")
  const [isActive, setIsActive] = useState(true)

  const {
    storefront_pages = [],
    isPending,
    isError,
    error,
  } = useStorefrontPages(
    { limit: 100, q: search || undefined },
    { enabled: !isLoading && canRead }
  )

  const createPage = useCreateStorefrontPage()

  if (isError) {
    throw error
  }

  const handleCreate = () => {
    if (!slug.trim() || !title.trim()) {
      toast.error("Slug and title are required")
      return
    }
    createPage.mutate(
      {
        slug: slug.trim().toLowerCase(),
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        page_type: pageType,
        is_active: isActive,
      },
      {
        onSuccess: ({ storefront_page }) => {
          toast.success(t("storefrontPages.created"))
          setCreateOpen(false)
          setSlug("")
          setTitle("")
          setSubtitle("")
          navigate(`/storefront-pages/${storefront_page.id}`)
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>{t("storefrontPages.domain")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("storefrontPages.description")}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            size="small"
            placeholder={t("storefrontPages.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />
          <Button size="small" variant="secondary" asChild>
            <Link to="/storefront-pages/colors">
              {t("storefrontPages.colors")}
            </Link>
          </Button>
          <PermissionGuard permission="storefront_page:create">
            <Button size="small" onClick={() => setCreateOpen(true)}>
              {t("actions.create")}
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {isPending || !storefront_pages.length ? (
        <Text size="small" className="text-ui-fg-subtle px-6 py-8">
          {t(isPending ? "storefrontPages.loading" : "storefrontPages.empty")}
        </Text>
      ) : (
        <ul className="divide-y">
          {storefront_pages.map((page) => (
            <li key={page.id}>
              <Link
                to={`/storefront-pages/${page.id}`}
                className="hover:bg-ui-bg-base-hover flex flex-wrap items-center justify-between gap-3 px-6 py-3.5"
              >
                <div className="min-w-0">
                  <Text size="small" weight="plus">
                    {page.title}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    /{page.page_type === "home" ? "" : `landings/${page.slug}`} ·{" "}
                    {page.sections?.length ?? 0} sections
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="2xsmall" color="blue">
                    {page.page_type}
                  </Badge>
                  <Badge
                    size="2xsmall"
                    color={page.is_active ? "green" : "grey"}
                  >
                    {page.is_active ? "Active" : "Draft"}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={createOpen} onOpenChange={setCreateOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{t("storefrontPages.createTitle")}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4 p-6">
            <div className="flex flex-col gap-1">
              <Label size="small">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="jackets"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label size="small">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="کاپشن و پالتو"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label size="small">Subtitle</Label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label size="small">Page Type</Label>
              <Select
                value={pageType}
                onValueChange={(v) => setPageType(v as "home" | "landing")}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="home">Home</Select.Item>
                  <Select.Item value="landing">Landing</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label size="small">Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCreateOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              size="small"
              isLoading={createPage.isPending}
              onClick={handleCreate}
            >
              {t("actions.create")}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const StorefrontPageList = () => (
  <LayoutComposer
    widgetsZonePrefix="storefront_page.list"
    preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
    disableWidgets
    sections={{
      main: (
        <LayoutComposer.Entry id="StorefrontPageListSection">
          <StorefrontPageListSection />
        </LayoutComposer.Entry>
      ),
    }}
  />
)
