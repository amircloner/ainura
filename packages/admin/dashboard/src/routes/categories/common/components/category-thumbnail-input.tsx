import { Photo, Trash } from "@medusajs/icons"
import { Button, Input, toast } from "@medusajs/ui"
import { ChangeEvent, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { sdk } from "../../../../lib/client"

type CategoryThumbnailInputProps = {
  value?: string | null
  onChange: (value: string) => void
}

export const CategoryThumbnailInput = ({
  value,
  onChange,
}: CategoryThumbnailInputProps) => {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) {
      return
    }
    setIsUploading(true)
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      if (files[0]?.url) {
        onChange(files[0].url)
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("errors.serverError")
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <div className="flex items-center gap-x-3">
        <div className="bg-ui-bg-subtle border-ui-border-base flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border">
          {value ? (
            <img
              src={value}
              alt=""
              className="size-full object-cover"
            />
          ) : (
            <Photo className="text-ui-fg-muted" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-y-2">
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t("categories.fields.thumbnail.urlPlaceholder")}
            autoComplete="off"
          />
          <div className="flex items-center gap-x-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              size="small"
              variant="secondary"
              isLoading={isUploading}
              onClick={() => fileRef.current?.click()}
            >
              {t("categories.fields.thumbnail.upload")}
            </Button>
            {value && (
              <Button
                type="button"
                size="small"
                variant="transparent"
                onClick={() => onChange("")}
              >
                <Trash />
                {t("categories.fields.thumbnail.remove")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
