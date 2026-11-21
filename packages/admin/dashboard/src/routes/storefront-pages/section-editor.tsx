import { HttpTypes, StoreTypes } from "@medusajs/types"
import {
  Badge,
  Button,
  Drawer,
  Input,
  Label,
  Select,
  Switch,
  Text,
  toast,
} from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useBrands } from "../../hooks/api/brands"
import { useProductCategories } from "../../hooks/api/categories"
import { useCollections } from "../../hooks/api/collections"
import { useProducts } from "../../hooks/api/products"
import {
  useCreateStorefrontSection,
  useUpdateStorefrontSection,
} from "../../hooks/api/storefront-pages"

export const SECTION_TYPE_LABELS: Record<
  StoreTypes.StorefrontSectionType,
  string
> = {
  hero_banner: "Hero Slider Banner",
  category_row: "Category Image Row",
  brand_marquee: "Brand Marquee Row",
  amazing_carousel: "Amazing Offer Carousel",
  tab_carousel: "Tabbed Product Carousel",
  simple_carousel: "Product Carousel",
  two_banner: "Two-Column Banners",
  four_banner: "Four-Column Banners",
  trust_badges: "Trust Badges Row",
}

const DEFAULT_SOURCE: StoreTypes.StorefrontProductSource = {
  mode: "hybrid",
  product_ids: [],
  category_id: null,
  brand_id: null,
  collection_id: null,
  on_sale: false,
  sort: "newest",
  limit: 12,
}

function ProductSourceEditor({
  value,
  onChange,
}: {
  value: StoreTypes.StorefrontProductSource
  onChange: (next: StoreTypes.StorefrontProductSource) => void
}) {
  const [productSearch, setProductSearch] = useState("")
  const { products = [] } = useProducts({
    limit: 30,
    q: productSearch || undefined,
    fields: "id,title,handle,thumbnail",
  })
  const { product_categories = [] } = useProductCategories({ limit: 100 })
  const { brands = [] } = useBrands({ limit: 100 })
  const { collections = [] } = useCollections({ limit: 100 })

  const selectedIds = value.product_ids ?? []

  const toggleProduct = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((item) => item !== id)
      : [...selectedIds, id]
    onChange({ ...value, product_ids: next })
  }

  return (
    <div className="border-ui-border-base flex flex-col gap-3 rounded-md border p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <Label size="xsmall">Selection Mode</Label>
          <Select
            value={value.mode}
            onValueChange={(mode) =>
              onChange({
                ...value,
                mode: mode as StoreTypes.StorefrontProductSource["mode"],
              })
            }
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="hybrid">Hybrid (Manual + Filter)</Select.Item>
              <Select.Item value="manual">Manual Products Only</Select.Item>
              <Select.Item value="filter">Filter Only</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <Label size="xsmall">Max Products</Label>
          <Input
            type="number"
            min={1}
            max={48}
            value={value.limit ?? 12}
            onChange={(e) =>
              onChange({
                ...value,
                limit: Math.max(1, Math.min(48, Number(e.target.value) || 12)),
              })
            }
          />
        </div>
      </div>

      {value.mode !== "manual" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <Label size="xsmall">Category</Label>
            <Select
              value={value.category_id || "__none__"}
              onValueChange={(v) =>
                onChange({ ...value, category_id: v === "__none__" ? null : v })
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="All categories" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">All categories</Select.Item>
                {product_categories.map((cat) => (
                  <Select.Item key={cat.id} value={cat.id}>
                    {cat.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label size="xsmall">Brand</Label>
            <Select
              value={value.brand_id || "__none__"}
              onValueChange={(v) =>
                onChange({ ...value, brand_id: v === "__none__" ? null : v })
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="All brands" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">All brands</Select.Item>
                {brands.map((brand) => (
                  <Select.Item key={brand.id} value={brand.id}>
                    {brand.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label size="xsmall">Collection</Label>
            <Select
              value={value.collection_id || "__none__"}
              onValueChange={(v) =>
                onChange({
                  ...value,
                  collection_id: v === "__none__" ? null : v,
                })
              }
            >
              <Select.Trigger>
                <Select.Value placeholder="All collections" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__none__">All collections</Select.Item>
                {collections.map((col) => (
                  <Select.Item key={col.id} value={col.id}>
                    {col.title}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <Label size="xsmall">Sort Order</Label>
            <Select
              value={value.sort ?? "newest"}
              onValueChange={(sort) =>
                onChange({
                  ...value,
                  sort: sort as StoreTypes.StorefrontProductSource["sort"],
                })
              }
            >
              <Select.Trigger>
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="newest">Newest</Select.Item>
                <Select.Item value="discount">Highest Discount</Select.Item>
                <Select.Item value="price_asc">Lowest Price</Select.Item>
                <Select.Item value="price_desc">Highest Price</Select.Item>
              </Select.Content>
            </Select>
          </div>

          <div className="col-span-2 flex items-center justify-between pt-1">
            <Label size="xsmall">Only Discounted Products</Label>
            <Switch
              checked={Boolean(value.on_sale)}
              onCheckedChange={(checked) =>
                onChange({ ...value, on_sale: checked })
              }
            />
          </div>
        </div>
      )}

      {value.mode !== "filter" && (
        <div className="flex flex-col gap-2">
          <Label size="xsmall">
            Manual Products ({selectedIds.length} selected)
          </Label>
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedIds.map((id) => {
                const match = products.find((p) => p.id === id)
                return (
                  <Badge key={id} size="2xsmall" color="blue">
                    <span>{match?.title ?? id}</span>
                    <button
                      type="button"
                      className="ms-1 font-bold"
                      onClick={() => toggleProduct(id)}
                    >
                      ×
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}
          <Input
            type="search"
            size="small"
            placeholder="Search products to add..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <div className="border-ui-border-base max-h-40 divide-y overflow-y-auto rounded border">
            {products.map((product) => {
              const checked = selectedIds.includes(product.id)
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => toggleProduct(product.id)}
                  className="hover:bg-ui-bg-base-hover flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-start text-xs"
                >
                  <span className="truncate">{product.title}</span>
                  <Badge size="2xsmall" color={checked ? "green" : "grey"}>
                    {checked ? "Added" : "Add"}
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function SectionEditorDrawer({
  pageId,
  section,
  open,
  onOpenChange,
}: {
  pageId: string
  section?: HttpTypes.AdminStorefrontSection | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const createSection = useCreateStorefrontSection(pageId)
  const updateSection = useUpdateStorefrontSection(pageId)

  const [type, setType] = useState<StoreTypes.StorefrontSectionType>(
    section?.type ?? "simple_carousel"
  )
  const [title, setTitle] = useState(section?.title ?? "")
  const [href, setHref] = useState(section?.href ?? "")
  const [isActive, setIsActive] = useState(section?.is_active ?? true)
  const [config, setConfig] = useState<StoreTypes.StorefrontSectionConfig>(
    section?.config ?? {}
  )

  const isBannerType =
    type === "hero_banner" || type === "two_banner" || type === "four_banner"
  const bannerKey = type === "hero_banner" ? "slides" : "banners"
  const bannerList = (config[bannerKey] ?? []) as StoreTypes.StorefrontBannerItem[]
  const tileList = config.items ?? []
  const brandItems = config.brand_items ?? []
  const tabList = config.tabs ?? []

  const handleSave = () => {
    const payload = {
      type,
      title: title.trim() || null,
      href: href.trim() || null,
      is_active: isActive,
      config,
    }
    if (section) {
      updateSection.mutate(
        { sectionId: section.id, payload },
        {
          onSuccess: () => {
            toast.success(t("storefrontPages.sectionSaved"))
            onOpenChange(false)
          },
          onError: (err) => toast.error(err.message),
        }
      )
    } else {
      createSection.mutate(payload, {
        onSuccess: () => {
          toast.success(t("storefrontPages.sectionCreated"))
          onOpenChange(false)
        },
        onError: (err) => toast.error(err.message),
      })
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-2xl">
        <Drawer.Header>
          <Drawer.Title>
            {section
              ? t("storefrontPages.editSection")
              : t("storefrontPages.addSection")}
          </Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label size="small">Section Type</Label>
              <Select
                value={type}
                onValueChange={(next) =>
                  setType(next as StoreTypes.StorefrontSectionType)
                }
                disabled={Boolean(section)}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {Object.entries(SECTION_TYPE_LABELS).map(([key, label]) => (
                    <Select.Item key={key} value={key}>
                      {label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex items-end justify-between pb-2">
              <Label size="small">Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label size="small">Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Section heading"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label size="small">See-All Link</Label>
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="/landings/jackets"
              />
            </div>
          </div>

          {isBannerType && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus">
                  Banners ({bannerList.length})
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      [bannerKey]: [
                        ...bannerList,
                        { desktop_image: "", mobile_image: "", href: "/products", alt: "" },
                      ],
                    })
                  }
                >
                  + Add Banner
                </Button>
              </div>
              {bannerList.map((item, idx) => (
                <div
                  key={idx}
                  className="border-ui-border-base flex flex-col gap-2 rounded border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {item.desktop_image && (
                        <img
                          src={item.desktop_image}
                          alt=""
                          className="h-10 w-16 rounded object-cover"
                        />
                      )}
                      <Text size="xsmall" weight="plus">
                        Banner #{idx + 1}
                      </Text>
                    </div>
                    <Button
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          [bannerKey]: bannerList.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <Input
                    placeholder="Desktop Image URL"
                    value={item.desktop_image}
                    onChange={(e) => {
                      const next = [...bannerList]
                      next[idx] = { ...item, desktop_image: e.target.value }
                      setConfig({ ...config, [bannerKey]: next })
                    }}
                  />
                  <Input
                    placeholder="Mobile Image URL (optional)"
                    value={item.mobile_image ?? ""}
                    onChange={(e) => {
                      const next = [...bannerList]
                      next[idx] = { ...item, mobile_image: e.target.value }
                      setConfig({ ...config, [bannerKey]: next })
                    }}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Link (/landings/jackets)"
                      value={item.href}
                      onChange={(e) => {
                        const next = [...bannerList]
                        next[idx] = { ...item, href: e.target.value }
                        setConfig({ ...config, [bannerKey]: next })
                      }}
                    />
                    <Input
                      placeholder="Alt text"
                      value={item.alt ?? ""}
                      onChange={(e) => {
                        const next = [...bannerList]
                        next[idx] = { ...item, alt: e.target.value }
                        setConfig({ ...config, [bannerKey]: next })
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {(type === "category_row" || type === "trust_badges") && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus">
                  Items ({tileList.length})
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      items: [...tileList, { title: "", image: "", href: "/products" }],
                    })
                  }
                >
                  + Add Item
                </Button>
              </div>
              {tileList.map((item, idx) => (
                <div
                  key={idx}
                  className="border-ui-border-base flex flex-col gap-2 rounded border p-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="h-9 w-9 rounded object-cover"
                        />
                      )}
                      <Text size="xsmall" weight="plus">
                        Item #{idx + 1}
                      </Text>
                    </div>
                    <Button
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          items: tileList.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Title"
                      value={item.title}
                      onChange={(e) => {
                        const next = [...tileList]
                        next[idx] = { ...item, title: e.target.value }
                        setConfig({ ...config, items: next })
                      }}
                    />
                    <Input
                      placeholder="Link (optional)"
                      value={item.href ?? ""}
                      onChange={(e) => {
                        const next = [...tileList]
                        next[idx] = { ...item, href: e.target.value }
                        setConfig({ ...config, items: next })
                      }}
                    />
                  </div>
                  <Input
                    placeholder="Image URL"
                    value={item.image}
                    onChange={(e) => {
                      const next = [...tileList]
                      next[idx] = { ...item, image: e.target.value }
                      setConfig({ ...config, items: next })
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {type === "brand_marquee" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Label size="small">Reverse Scroll Direction</Label>
                <Switch
                  checked={Boolean(config.reverse)}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, reverse: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus">
                  Brand Cards ({brandItems.length})
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      brand_items: [
                        ...brandItems,
                        { image: "", href: "/brands/dorsa", alt: "" },
                      ],
                    })
                  }
                >
                  + Add Brand Card
                </Button>
              </div>
              {brandItems.map((item, idx) => (
                <div
                  key={idx}
                  className="border-ui-border-base flex items-center gap-2 rounded border p-2.5"
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt=""
                      className="h-12 w-9 shrink-0 rounded object-cover"
                    />
                  )}
                  <div className="grid flex-1 grid-cols-2 gap-2">
                    <Input
                      placeholder="Image URL"
                      value={item.image}
                      onChange={(e) => {
                        const next = [...brandItems]
                        next[idx] = { ...item, image: e.target.value }
                        setConfig({ ...config, brand_items: next })
                      }}
                    />
                    <Input
                      placeholder="Link (/brands/...)"
                      value={item.href}
                      onChange={(e) => {
                        const next = [...brandItems]
                        next[idx] = { ...item, href: e.target.value }
                        setConfig({ ...config, brand_items: next })
                      }}
                    />
                  </div>
                  <Button
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        brand_items: brandItems.filter((_, i) => i !== idx),
                      })
                    }
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}

          {(type === "amazing_carousel" || type === "simple_carousel") && (
            <div className="flex flex-col gap-3">
              {type === "amazing_carousel" && (
                <div className="flex flex-col gap-1">
                  <Label size="small">Countdown End ISO Date (optional)</Label>
                  <Input
                    value={config.end_date_time ?? ""}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        end_date_time: e.target.value || null,
                      })
                    }
                    placeholder="2026-12-31T23:59:59Z"
                  />
                </div>
              )}
              <ProductSourceEditor
                value={config.source ?? DEFAULT_SOURCE}
                onChange={(source) => setConfig({ ...config, source })}
              />
            </div>
          )}

          {type === "tab_carousel" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Text size="small" weight="plus">
                  Tabs ({tabList.length})
                </Text>
                <Button
                  size="small"
                  variant="secondary"
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      tabs: [
                        ...tabList,
                        {
                          title: `Tab ${tabList.length + 1}`,
                          href: "/products",
                          source: { ...DEFAULT_SOURCE },
                        },
                      ],
                    })
                  }
                >
                  + Add Tab
                </Button>
              </div>
              {tabList.map((tab, idx) => (
                <div
                  key={idx}
                  className="border-ui-border-base flex flex-col gap-2 rounded border p-3"
                >
                  <div className="flex items-center justify-between">
                    <Text size="small" weight="plus">
                      Tab #{idx + 1}
                    </Text>
                    <Button
                      size="small"
                      variant="transparent"
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          tabs: tabList.filter((_, i) => i !== idx),
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Tab title"
                      value={tab.title}
                      onChange={(e) => {
                        const next = [...tabList]
                        next[idx] = { ...tab, title: e.target.value }
                        setConfig({ ...config, tabs: next })
                      }}
                    />
                    <Input
                      placeholder="Tab see-all link"
                      value={tab.href ?? ""}
                      onChange={(e) => {
                        const next = [...tabList]
                        next[idx] = { ...tab, href: e.target.value }
                        setConfig({ ...config, tabs: next })
                      }}
                    />
                  </div>
                  <ProductSourceEditor
                    value={tab.source ?? DEFAULT_SOURCE}
                    onChange={(source) => {
                      const next = [...tabList]
                      next[idx] = { ...tab, source }
                      setConfig({ ...config, tabs: next })
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Button
            variant="secondary"
            size="small"
            type="button"
            onClick={() => onOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            size="small"
            type="button"
            isLoading={createSection.isPending || updateSection.isPending}
            onClick={handleSave}
          >
            {t("actions.save")}
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}
