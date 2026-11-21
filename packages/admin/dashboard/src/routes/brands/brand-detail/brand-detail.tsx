import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { PencilSquare, Trash } from "@medusajs/icons"
import { Container, Heading, toast, usePrompt } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { ActionMenu } from "../../../components/common/action-menu"
import { SectionRow } from "../../../components/common/section"
import { SingleColumnPageSkeleton } from "../../../components/common/skeleton"
import { LayoutComposer } from "../../../components/layout-composer"
import { useBrand, useDeleteBrand } from "../../../hooks/api/brands"
import { useResourcePermissions } from "../../../hooks/use-resource-permissions"

export const BrandDetail = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const prompt = usePrompt()
  const { canRead, canUpdate, canDelete, isLoading } =
    useResourcePermissions("product_brand")
  const { brand, isError, error } = useBrand(id!, {
    enabled: !isLoading && canRead,
  })
  const { mutate: deleteBrand, isPending: isDeleting } = useDeleteBrand(id!)

  if (isError) {
    throw error
  }

  if (!brand) {
    return <SingleColumnPageSkeleton sections={1} />
  }

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("brands.deleteWarning", { name: brand.name }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (confirmed) {
      deleteBrand(undefined, {
        onSuccess: () => {
          toast.success(t("brands.deleted"))
          navigate("/brands", { replace: true })
        },
        onError: (error) => toast.error(error.message),
      })
    }
  }

  const actions = [
    ...(canUpdate
      ? [{ label: t("actions.edit"), to: "edit", icon: <PencilSquare /> }]
      : []),
    ...(canDelete
      ? [
          {
            label: t("actions.delete"),
            onClick: handleDelete,
            icon: <Trash />,
            disabled: isDeleting,
          },
        ]
      : []),
  ]

  return (
    <LayoutComposer
      widgetsZonePrefix="product_brand.details"
      preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
      disableWidgets
      data={brand}
      sections={{
        main: (
          <LayoutComposer.Entry id="BrandGeneralSection">
            <Container className="divide-y p-0">
              <div className="flex items-center justify-between gap-2 px-6 py-4">
                <Heading className="min-w-0 break-words">{brand.name}</Heading>
                {!!actions.length && <ActionMenu groups={[{ actions }]} />}
              </div>
              <SectionRow
                title={t("fields.handle")}
                value={`/${brand.handle}`}
              />
              <SectionRow
                title={t("fields.description")}
                value={brand.description}
              />
              <SectionRow title={t("fields.country")} value={brand.country} />
              <SectionRow title={t("brands.logoUrl")} value={brand.logo_url} />
              <SectionRow
                title={t("brands.bannerUrl")}
                value={brand.banner_url}
              />
              <SectionRow
                title={t("brands.featured")}
                value={t(brand.is_featured ? "fields.yes" : "fields.no")}
              />
            </Container>
          </LayoutComposer.Entry>
        ),
      }}
    />
  )
}
