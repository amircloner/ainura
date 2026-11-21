import { HttpTypes, ProductFashionMetadata } from "@medusajs/types"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { PermissionGuard } from "../../../../../components/common/permission-guard"
import { SectionRow } from "../../../../../components/common/section"
import {
  useProducts,
  useUpdateProduct,
} from "../../../../../hooks/api/products"

export const ProductFashionSection = ({
  product,
}: {
  product: HttpTypes.AdminProduct
}) => {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const meta = (product.metadata ?? {}) as ProductFashionMetadata

  const [productCode, setProductCode] = useState(meta.product_code ?? "")
  const [sellerName, setSellerName] = useState(meta.seller_name ?? "")
  const [warranty, setWarranty] = useState(meta.warranty ?? "")
  const [returnPolicy, setReturnPolicy] = useState(meta.return_policy ?? "")
  const [leadTimeDays, setLeadTimeDays] = useState(
    meta.lead_time_days != null ? String(meta.lead_time_days) : ""
  )
  const [promoBadge, setPromoBadge] = useState(meta.promo_badge ?? "")
  const [sellerStars, setSellerStars] = useState(
    meta.seller_stats?.stars != null ? String(meta.seller_stats.stars) : ""
  )
  const [shipOnTime, setShipOnTime] = useState(
    meta.seller_stats?.ship_on_time != null
      ? String(meta.seller_stats.ship_on_time)
      : ""
  )
  const [noReturn, setNoReturn] = useState(
    meta.seller_stats?.no_return != null
      ? String(meta.seller_stats.no_return)
      : ""
  )
  const [regDate, setRegDate] = useState(
    meta.seller_stats?.registration_date ?? ""
  )
  const [specs, setSpecs] = useState<Array<{ label: string; value: string }>>(
    meta.specifications ?? []
  )
  const [sizeNote, setSizeNote] = useState(
    meta.size_guide?.measurement_note ?? ""
  )
  const [sizeCols, setSizeCols] = useState(
    (meta.size_guide?.columns ?? []).join(", ")
  )
  const [sizeRows, setSizeRows] = useState(
    (meta.size_guide?.rows ?? []).map((r) => r.join(", ")).join("\n")
  )
  const [recIds, setRecIds] = useState<string[]>(
    meta.recommended_product_ids ?? []
  )
  const [recSearch, setRecSearch] = useState("")

  const { products: searchProducts = [] } = useProducts(
    { limit: 20, q: recSearch || undefined, fields: "id,title" },
    { enabled: open }
  )

  const updateProduct = useUpdateProduct(product.id)

  const openEditor = () => {
    const m = (product.metadata ?? {}) as ProductFashionMetadata
    setProductCode(m.product_code ?? "")
    setSellerName(m.seller_name ?? "")
    setWarranty(m.warranty ?? "")
    setReturnPolicy(m.return_policy ?? "")
    setLeadTimeDays(m.lead_time_days != null ? String(m.lead_time_days) : "")
    setPromoBadge(m.promo_badge ?? "")
    setSellerStars(
      m.seller_stats?.stars != null ? String(m.seller_stats.stars) : ""
    )
    setShipOnTime(
      m.seller_stats?.ship_on_time != null
        ? String(m.seller_stats.ship_on_time)
        : ""
    )
    setNoReturn(
      m.seller_stats?.no_return != null ? String(m.seller_stats.no_return) : ""
    )
    setRegDate(m.seller_stats?.registration_date ?? "")
    setSpecs(m.specifications ?? [])
    setSizeNote(m.size_guide?.measurement_note ?? "")
    setSizeCols((m.size_guide?.columns ?? []).join(", "))
    setSizeRows((m.size_guide?.rows ?? []).map((r) => r.join(", ")).join("\n"))
    setRecIds(m.recommended_product_ids ?? [])
    setOpen(true)
  }

  const handleSave = () => {
    const columns = sizeCols
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    const rows = sizeRows
      .split("\n")
      .map((line) =>
        line
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean)
      )
      .filter((r) => r.length > 0)

    const nextFashion: ProductFashionMetadata = {
      product_code: productCode.trim() || undefined,
      seller_name: sellerName.trim() || undefined,
      warranty: warranty.trim() || undefined,
      return_policy: returnPolicy.trim() || undefined,
      lead_time_days: leadTimeDays.trim() ? Number(leadTimeDays) : undefined,
      promo_badge: promoBadge.trim() || undefined,
      seller_stats:
        sellerStars || shipOnTime || noReturn || regDate
          ? {
              stars: sellerStars ? Number(sellerStars) : undefined,
              ship_on_time: shipOnTime ? Number(shipOnTime) : undefined,
              no_return: noReturn ? Number(noReturn) : undefined,
              registration_date: regDate.trim() || undefined,
            }
          : undefined,
      specifications: specs.filter((s) => s.label.trim() && s.value.trim()),
      size_guide:
        columns.length && rows.length
          ? {
              columns,
              rows,
              measurement_note: sizeNote.trim() || undefined,
            }
          : undefined,
      recommended_product_ids: recIds.length ? recIds : undefined,
    }

    updateProduct.mutate(
      {
        metadata: {
          ...(product.metadata ?? {}),
          ...nextFashion,
        },
      },
      {
        onSuccess: () => {
          toast.success(t("storefrontPages.fashionDetailsSaved"))
          setOpen(false)
        },
        onError: (err) => toast.error(err.message),
      }
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("storefrontPages.fashionDetails")}</Heading>
        <PermissionGuard permission="product:update">
          <Button size="small" variant="secondary" onClick={openEditor}>
            {t("actions.edit")}
          </Button>
        </PermissionGuard>
      </div>
      <SectionRow title="Product Code" value={meta.product_code || "-"} />
      <SectionRow title="Seller" value={meta.seller_name || "-"} />
      <SectionRow title="Warranty" value={meta.warranty || "-"} />
      <SectionRow title="Promo Badge" value={meta.promo_badge || "-"} />
      <SectionRow
        title="Specifications"
        value={`${meta.specifications?.length ?? 0} rows`}
      />
      <SectionRow
        title="Recommended Products"
        value={`${meta.recommended_product_ids?.length ?? 0} linked`}
      />

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content className="max-w-2xl">
          <Drawer.Header>
            <Drawer.Title>{t("storefrontPages.fashionDetails")}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body className="flex flex-col gap-4 overflow-y-auto p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Product Code</Label>
                <Input
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Promo Badge</Label>
                <Input
                  value={promoBadge}
                  onChange={(e) => setPromoBadge(e.target.value)}
                  placeholder="حراج استایل"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Seller Name</Label>
                <Input
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Lead Time (days)</Label>
                <Input
                  type="number"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Warranty</Label>
                <Input
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Return Policy</Label>
                <Input
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Seller Stars</Label>
                <Input
                  value={sellerStars}
                  onChange={(e) => setSellerStars(e.target.value)}
                  placeholder="4.55"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Ship on time %</Label>
                <Input
                  value={shipOnTime}
                  onChange={(e) => setShipOnTime(e.target.value)}
                  placeholder="100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">No return %</Label>
                <Input
                  value={noReturn}
                  onChange={(e) => setNoReturn(e.target.value)}
                  placeholder="98"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label size="xsmall">Registration</Label>
                <Input
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus">
                  Specifications ({specs.length})
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() => setSpecs([...specs, { label: "", value: "" }])}
                >
                  + Add Row
                </Button>
              </div>
              {specs.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    placeholder="Label"
                    value={row.label}
                    onChange={(e) => {
                      const next = [...specs]
                      next[idx] = { ...row, label: e.target.value }
                      setSpecs(next)
                    }}
                  />
                  <Input
                    placeholder="Value"
                    value={row.value}
                    onChange={(e) => {
                      const next = [...specs]
                      next[idx] = { ...row, value: e.target.value }
                      setSpecs(next)
                    }}
                  />
                  <Button
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <Text size="small" weight="plus">
                Size Guide
              </Text>
              <Input
                placeholder="Columns (comma separated, e.g. سایز, دور سینه, قد)"
                value={sizeCols}
                onChange={(e) => setSizeCols(e.target.value)}
              />
              <Textarea
                rows={4}
                placeholder="One row per line, comma separated (e.g. M, 92-96, 68)"
                value={sizeRows}
                onChange={(e) => setSizeRows(e.target.value)}
              />
              <Input
                placeholder="Measurement note"
                value={sizeNote}
                onChange={(e) => setSizeNote(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Text size="small" weight="plus">
                Recommended Products ({recIds.length})
              </Text>
              {recIds.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {recIds.map((id) => (
                    <Badge key={id} size="2xsmall" color="blue">
                      <span>{id}</span>
                      <button
                        type="button"
                        className="ms-1 font-bold"
                        onClick={() => setRecIds(recIds.filter((x) => x !== id))}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <Input
                type="search"
                size="small"
                placeholder="Search products..."
                value={recSearch}
                onChange={(e) => setRecSearch(e.target.value)}
              />
              <div className="border-ui-border-base max-h-36 divide-y overflow-y-auto rounded border">
                {searchProducts
                  .filter((p) => p.id !== product.id)
                  .map((p) => {
                    const added = recIds.includes(p.id)
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() =>
                          setRecIds(
                            added
                              ? recIds.filter((x) => x !== p.id)
                              : [...recIds, p.id]
                          )
                        }
                        className="hover:bg-ui-bg-base-hover flex w-full items-center justify-between px-2.5 py-1.5 text-start text-xs"
                      >
                        <span className="truncate">{p.title}</span>
                        <Badge size="2xsmall" color={added ? "green" : "grey"}>
                          {added ? "Linked" : "Link"}
                        </Badge>
                      </button>
                    )
                  })}
              </div>
            </div>
          </Drawer.Body>
          <Drawer.Footer>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setOpen(false)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              size="small"
              isLoading={updateProduct.isPending}
              onClick={handleSave}
            >
              {t("actions.save")}
            </Button>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}
