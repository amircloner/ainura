import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button, Heading, Input, Textarea, toast } from "@medusajs/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
import * as zod from "zod"
import { Form } from "../../components/common/form"
import { SwitchBox } from "../../components/common/switch-box"
import { HandleInput } from "../../components/inputs/handle-input"
import { RouteDrawer, useRouteModal } from "../../components/modals"
import { KeyboundForm } from "../../components/utilities/keybound-form"
import {
  useBrand,
  useCreateBrand,
  useUpdateBrand,
} from "../../hooks/api/brands"
import { useResourcePermissions } from "../../hooks/use-resource-permissions"

const BrandSchema = zod.object({
  name: zod.string().trim().min(1),
  handle: zod.string().trim(),
  country: zod.string().trim(),
  logo_url: zod.string().trim(),
  banner_url: zod.string().trim(),
  description: zod.string().trim(),
  is_featured: zod.boolean(),
})

const BrandForm = ({ brand }: { brand?: HttpTypes.AdminBrand }) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const create = useCreateBrand()
  const update = useUpdateBrand(brand?.id ?? "")
  const form = useForm({
    defaultValues: {
      name: brand?.name ?? "",
      handle: brand?.handle ?? "",
      country: brand?.country ?? "",
      logo_url: brand?.logo_url ?? "",
      banner_url: brand?.banner_url ?? "",
      description: brand?.description ?? "",
      is_featured: brand?.is_featured ?? false,
    },
    resolver: zodResolver(BrandSchema),
  })

  const handleSubmit = form.handleSubmit((data) => {
    if (brand && !data.handle) {
      form.setError("handle", { message: t("brands.handleRequired") })
      return
    }

    const payload = {
      name: data.name,
      handle: data.handle || undefined,
      country: data.country || null,
      logo_url: data.logo_url || null,
      banner_url: data.banner_url || null,
      description: data.description || null,
      is_featured: data.is_featured,
    }

    const mutation = brand ? update : create
    mutation.mutate(payload, {
      onSuccess: ({ brand: savedBrand }) => {
        toast.success(t(brand ? "brands.updated" : "brands.created"))
        handleSuccess(`/brands/${savedBrand.id}`)
      },
      onError: (error) => toast.error(error.message),
    })
  })

  const textFields = [
    { name: "name", label: t("fields.name"), Component: Input },
    { name: "handle", label: t("fields.handle"), Component: HandleInput },
    { name: "country", label: t("fields.country"), Component: Input },
    { name: "logo_url", label: t("brands.logoUrl"), Component: Input },
    { name: "banner_url", label: t("brands.bannerUrl"), Component: Input },
    {
      name: "description",
      label: t("fields.description"),
      Component: Textarea,
    },
  ] as const

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-4 overflow-y-auto">
          {textFields.map(({ name, label, Component }) => (
            <Form.Field
              key={name}
              control={form.control}
              name={name}
              render={({ field }) => (
                <Form.Item>
                  <Form.Label
                    optional={name !== "name" && !(brand && name === "handle")}
                  >
                    {label}
                  </Form.Label>
                  <Form.Control>
                    <Component {...field} />
                  </Form.Control>
                  <Form.ErrorMessage />
                </Form.Item>
              )}
            />
          ))}
          <SwitchBox
            control={form.control}
            name="is_featured"
            label={t("brands.featured")}
            description={t("brands.featuredHint")}
          />
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <RouteDrawer.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteDrawer.Close>
          <Button
            size="small"
            type="submit"
            isLoading={create.isPending || update.isPending}
          >
            {t(brand ? "actions.save" : "actions.create")}
          </Button>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

export const BrandCreate = () => {
  const { t } = useTranslation()
  const { canRead, canCreate, isLoading } =
    useResourcePermissions("product_brand")

  if (isLoading || !canRead || !canCreate) {
    return null
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("brands.create")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      <BrandForm />
    </RouteDrawer>
  )
}

export const BrandEdit = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  // The parent detail route owns the fetch and renders this drawer after loading.
  const { brand } = useBrand(id!, { enabled: false })

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <RouteDrawer.Title asChild>
          <Heading>{t("brands.edit")}</Heading>
        </RouteDrawer.Title>
      </RouteDrawer.Header>
      {brand && <BrandForm brand={brand} />}
    </RouteDrawer>
  )
}
