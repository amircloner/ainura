import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PermissionGuard } from "../../../components/common/permission-guard"
import { LayoutComposer } from "../../../components/layout-composer"
import {
  useDeleteStorefrontColor,
  useStorefrontColors,
  useUpsertStorefrontColor,
} from "../../../hooks/api/storefront-pages"

const StorefrontColorsSection = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState("")
  const [name, setName] = useState("")
  const [hex, setHex] = useState("#000000")

  const { storefront_colors = [], isPending } = useStorefrontColors({
    limit: 200,
    q: search || undefined,
  })
  const upsertColor = useUpsertStorefrontColor()
  const deleteColor = useDeleteStorefrontColor()

  const handleSave = () => {
    if (!name.trim()) return
    upsertColor.mutate(
      { name: name.trim(), hex_code: hex.trim() },
      {
        onSuccess: () => {
          toast.success(t("storefrontPages.colorSaved"))
          setName("")
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>{t("storefrontPages.colors")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Manage color name to hex swatch mappings displayed on storefront
            product cards and filters.
          </Text>
        </div>
        <Input
          type="search"
          size="small"
          placeholder="Search colors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
      </div>

      <PermissionGuard permission="storefront_page:update">
        <div className="flex flex-wrap items-center gap-2 px-6 py-3">
          <Input
            size="small"
            placeholder="Color name (e.g. آجری)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-52"
          />
          <input
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#000000"}
            onChange={(e) => setHex(e.target.value)}
            className="h-8 w-10 cursor-pointer rounded border"
          />
          <Input
            size="small"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="w-28"
          />
          <Button
            size="small"
            isLoading={upsertColor.isPending}
            onClick={handleSave}
          >
            Add / Update
          </Button>
        </div>
      </PermissionGuard>

      {isPending ? (
        <Text size="small" className="text-ui-fg-subtle px-6 py-6">
          Loading colors...
        </Text>
      ) : (
        <div className="grid grid-cols-1 divide-y sm:grid-cols-2 md:grid-cols-3">
          {storefront_colors.map((color) => (
            <div
              key={color.id}
              className="flex items-center justify-between gap-2 px-6 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="border-ui-border-base inline-block h-5 w-5 rounded-full border"
                  style={{ backgroundColor: color.hex_code }}
                />
                <div>
                  <Text size="small" weight="plus">
                    {color.name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {color.hex_code}
                  </Text>
                </div>
              </div>
              <PermissionGuard permission="storefront_page:delete">
                <Button
                  size="small"
                  variant="transparent"
                  onClick={() =>
                    deleteColor.mutate(color.id, {
                      onSuccess: () =>
                        toast.success(t("storefrontPages.colorDeleted")),
                    })
                  }
                >
                  ×
                </Button>
              </PermissionGuard>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const StorefrontColors = () => (
  <LayoutComposer
    widgetsZonePrefix="storefront_page.colors"
    preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
    disableWidgets
    sections={{
      main: (
        <LayoutComposer.Entry id="StorefrontColorsSection">
          <StorefrontColorsSection />
        </LayoutComposer.Entry>
      ),
    }}
  />
)
