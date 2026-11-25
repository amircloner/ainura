import { GlobeEurope, PencilSquare, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import {
  ActionGroup,
  ActionMenu,
} from "../../../../../components/common/action-menu"
import { useDeleteProductTagAction } from "../../../common/hooks/use-delete-product-tag-action"
import {
  useProductTagPermissions,
  useCanOpenTranslations,
} from "../../../../../hooks/use-resource-permissions"

type ProductTagGeneralSectionProps = {
  productTag: HttpTypes.AdminProductTag
}

export const ProductTagGeneralSection = ({
  productTag,
}: ProductTagGeneralSectionProps) => {
  const { t } = useTranslation()
  const handleDelete = useDeleteProductTagAction({ productTag })
  const { canUpdate, canDelete } = useProductTagPermissions()
  const canOpenTranslations = useCanOpenTranslations()

  const canManageTranslations = canOpenTranslations

  const groups: ActionGroup[] = []

  if (canUpdate) {
    groups.push({
      actions: [
        {
          icon: <PencilSquare />,
          label: t("actions.edit"),
          to: "edit",
        },
      ],
    })
  }

  if (canManageTranslations) {
    groups.push({
      actions: [
        {
          label: t("translations.actions.manage"),
          to: `/settings/translations/edit?reference=product_tag&reference_id=${productTag.id}`,
          icon: <GlobeEurope />,
        },
      ],
    })
  }

  if (canDelete) {
    groups.push({
      actions: [
        {
          icon: <Trash />,
          label: t("actions.delete"),
          onClick: handleDelete,
        },
      ],
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-1.5">
          <span className="h1-core text-ui-fg-muted">#</span>
          <Heading>{productTag.value}</Heading>
        </div>
        {groups.length > 0 && <ActionMenu groups={groups} />}
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-ui-fg-subtle">
        <Text size="small" leading="compact" weight="plus">
          {t("productTags.fields.handle")}
        </Text>
        <Text size="small" leading="compact">
          {productTag.handle ? `/${productTag.handle}` : "-"}
        </Text>
      </div>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 text-ui-fg-subtle">
        <Text size="small" leading="compact" weight="plus">
          {t("productTags.fields.description")}
        </Text>
        <Text size="small" leading="compact">
          {productTag.description || "-"}
        </Text>
      </div>
    </Container>
  )
}
