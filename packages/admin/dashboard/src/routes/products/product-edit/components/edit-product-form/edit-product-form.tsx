import { Button, Input, Select, Text, Textarea, toast } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import * as zod from "zod"

import { HttpTypes } from "@medusajs/types"
import { Form } from "../../../../../components/common/form"
import { SwitchBox } from "../../../../../components/common/switch-box"
import { Combobox } from "../../../../../components/inputs/combobox"
import { RouteDrawer, useRouteModal } from "../../../../../components/modals"
import { useExtendableForm } from "../../../../../dashboard-app/forms/hooks"
import { brandsQueryKeys } from "../../../../../hooks/api/brands"
import { useUpdateProduct } from "../../../../../hooks/api/products"
import { useComboboxData } from "../../../../../hooks/use-combobox-data"
import { useResourcePermissions } from "../../../../../hooks/use-resource-permissions"
import { sdk } from "../../../../../lib/client"
import { transformNullableFormData } from "../../../../../lib/form-helpers"

import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { FormExtensionZone } from "../../../../../dashboard-app"
import { useExtension } from "../../../../../providers/extension-provider"
import { useDocumentDirection } from "../../../../../hooks/use-document-direction"

type EditProductFormProps = {
  product: HttpTypes.AdminProduct
}

const EditProductSchema = zod.object({
  status: zod.enum(["draft", "published", "proposed", "rejected"]),
  title: zod.string().min(1),
  subtitle: zod.string().optional(),
  handle: zod.string().min(1),
  material: zod.string().optional(),
  description: zod.string().optional(),
  discountable: zod.boolean(),
  brand_id: zod.string().optional(),
})

export const EditProductForm = ({ product }: EditProductFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()
  const direction = useDocumentDirection()
  const { canRead: canReadBrands, isLoading: isLoadingBrandPermissions } =
    useResourcePermissions("product_brand")
  const canSelectBrand = !isLoadingBrandPermissions && canReadBrands
  const { getFormFields, getFormConfigs } = useExtension()
  const fields = getFormFields("product", "edit")
  const configs = getFormConfigs("product", "edit")

  const form = useExtendableForm({
    defaultValues: {
      status: product.status,
      title: product.title,
      material: product.material || "",
      subtitle: product.subtitle || "",
      handle: product.handle || "",
      description: product.description || "",
      discountable: product.discountable,
      brand_id: product.brand_id ?? "",
    },
    schema: EditProductSchema,
    configs: configs,
    data: product,
  })

  const selectedBrand = form.watch("brand_id")
  const brands = useComboboxData({
    queryKey: brandsQueryKeys.lists(),
    queryFn: (params) => sdk.admin.brand.list(params),
    getOptions: ({ brands }) =>
      brands.map(({ id, name }) => ({ value: id, label: name })),
    selectedValue: selectedBrand,
    enabled: canSelectBrand,
  })

  const { mutateAsync, isPending } = useUpdateProduct(product.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const { title, discountable, handle, status, brand_id, ...optional } = data

    const nullableData = transformNullableFormData(optional)

    await mutateAsync(
      {
        title,
        discountable,
        handle,
        status: status as HttpTypes.AdminProductStatus,
        ...nullableData,
        ...(canSelectBrand && form.getFieldState("brand_id").isDirty
          ? { brand_id: brand_id || null }
          : {}),
      },
      {
        onSuccess: ({ product }) => {
          toast.success(
            t("products.edit.successToast", { title: product.title })
          )
          handleSuccess()
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="status"
                render={({ field: { onChange, ref, ...field } }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.status")}</Form.Label>
                      <Form.Control>
                        <Select
                          dir={direction}
                          {...field}
                          onValueChange={onChange}
                        >
                          <Select.Trigger ref={ref}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {(
                              [
                                "draft",
                                "published",
                                "proposed",
                                "rejected",
                              ] as const
                            ).map((status) => {
                              return (
                                <Select.Item key={status} value={status}>
                                  {t(`products.productStatus.${status}`)}
                                </Select.Item>
                              )
                            })}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.title")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="subtitle"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.subtitle")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.handle")}</Form.Label>
                      <Form.Control>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r">
                            <Text
                              className="text-ui-fg-muted"
                              size="small"
                              leading="compact"
                              weight="plus"
                            >
                              /
                            </Text>
                          </div>
                          <Input {...field} className="pl-10" />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              <Form.Field
                control={form.control}
                name="material"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>{t("fields.material")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
              {canSelectBrand && (
                <Form.Field
                  control={form.control}
                  name="brand_id"
                  render={({ field }) => (
                    <Form.Item>
                      <Form.Label optional>{t("brands.singular")}</Form.Label>
                      <Form.Control>
                        <Combobox
                          {...field}
                          value={field.value ?? ""}
                          onChange={(value) => field.onChange(value || "")}
                          options={brands.options}
                          searchValue={brands.searchValue}
                          onSearchValueChange={brands.onSearchValueChange}
                          fetchNextPage={brands.fetchNextPage}
                          placeholder={t("brands.select")}
                          allowClear
                        />
                      </Form.Control>
                      {brands.isError && (
                        <Text
                          role="alert"
                          size="small"
                          className="text-ui-fg-error"
                        >
                          {t("brands.loadError")}
                        </Text>
                      )}
                      <Form.ErrorMessage />
                    </Form.Item>
                  )}
                />
              )}
              <Form.Field
                control={form.control}
                name="description"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label optional>
                        {t("fields.description")}
                      </Form.Label>
                      <Form.Control>
                        <Textarea {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  )
                }}
              />
            </div>
            <SwitchBox
              control={form.control}
              name="discountable"
              label={t("fields.discountable")}
              description={t("products.discountableHint")}
            />
            <FormExtensionZone fields={fields} form={form} />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}
