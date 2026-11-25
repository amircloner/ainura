import { Button, Input, Select, toast } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  useCreateProductCategory,
  useProductCategories,
} from "../../../../hooks/api/categories"
import { useDocumentDirection } from "../../../../hooks/use-document-direction"

const NO_PARENT = "__none__"

export const QuickCreateCategory = ({
  onCreated,
}: {
  onCreated: (id: string) => void
}) => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [parentId, setParentId] = useState(NO_PARENT)

  const { product_categories = [] } = useProductCategories(
    { limit: 200, fields: "id,name" },
    { enabled: open }
  )
  const { mutateAsync, isPending } = useCreateProductCategory()

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      return
    }
    try {
      const { product_category } = await mutateAsync({
        name: trimmed,
        parent_category_id: parentId === NO_PARENT ? undefined : parentId,
        is_active: true,
        is_internal: false,
      })
      toast.success(
        t("categories.create.successToast", { name: product_category.name })
      )
      onCreated(product_category.id)
      setName("")
      setParentId(NO_PARENT)
      setOpen(false)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.serverError")
      )
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover mt-1 self-start text-xs font-medium"
      >
        {t("categories.fields.quickCreate.toggle")}
      </button>
    )
  }

  return (
    <div className="bg-ui-bg-subtle border-ui-border-base mt-2 flex flex-col gap-y-2 rounded-md border p-3">
      <Input
        size="small"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("categories.fields.quickCreate.namePlaceholder")}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            void handleCreate()
          }
        }}
      />
      <Select dir={direction} value={parentId} onValueChange={setParentId}>
        <Select.Trigger>
          <Select.Value />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value={NO_PARENT}>
            {t("categories.fields.parent.none")}
          </Select.Item>
          {product_categories.map((cat) => (
            <Select.Item key={cat.id} value={cat.id}>
              {cat.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
      <div className="flex items-center justify-end gap-x-2">
        <Button
          type="button"
          size="small"
          variant="secondary"
          onClick={() => setOpen(false)}
        >
          {t("actions.cancel")}
        </Button>
        <Button
          type="button"
          size="small"
          isLoading={isPending}
          disabled={!name.trim()}
          onClick={() => void handleCreate()}
        >
          {t("categories.fields.quickCreate.add")}
        </Button>
      </div>
    </div>
  )
}
