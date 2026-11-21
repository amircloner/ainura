import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { Badge, Button, Container, Heading, Input, Text } from "@medusajs/ui"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { PermissionGuard } from "../../../components/common/permission-guard"
import { LayoutComposer } from "../../../components/layout-composer"
import { LocalizedTablePagination } from "../../../components/localization/localized-table-pagination"
import { useBrands } from "../../../hooks/api/brands"
import { useDebouncedSearch } from "../../../hooks/use-debounced-search"
import { useResourcePermissions } from "../../../hooks/use-resource-permissions"

const PAGE_SIZE = 20

const BrandListSection = () => {
  const { t } = useTranslation()
  const { canRead, isLoading } = useResourcePermissions("product_brand")
  const [page, setPage] = useState(0)
  const { searchValue, onSearchValueChange, query } = useDebouncedSearch()
  const {
    brands = [],
    count = 0,
    isPending,
    isError,
    error,
  } = useBrands(
    { limit: PAGE_SIZE, offset: page * PAGE_SIZE, q: query, order: "name" },
    { enabled: !isLoading && canRead }
  )

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>{t("brands.domain")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("brands.description")}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            size="small"
            aria-label={t("brands.search")}
            placeholder={t("brands.search")}
            value={searchValue}
            onChange={(event) => {
              setPage(0)
              onSearchValueChange(event.target.value)
            }}
            className="w-44"
          />
          <PermissionGuard permission="product_brand:create">
            <Button size="small" variant="secondary" asChild>
              <Link to="create">{t("actions.create")}</Link>
            </Button>
          </PermissionGuard>
        </div>
      </div>
      {isPending || !brands.length ? (
        <Text
          role="status"
          size="small"
          className="text-ui-fg-subtle px-6 py-8"
        >
          {t(isPending ? "brands.loading" : "brands.empty")}
        </Text>
      ) : (
        <ul className="divide-y">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                to={brand.id}
                className="hover:bg-ui-bg-base-hover flex flex-wrap items-center justify-between gap-2 px-6 py-3"
              >
                <div className="min-w-0">
                  <Text size="small" weight="plus" className="break-words">
                    {brand.name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle break-words">
                    /{brand.handle}
                  </Text>
                </div>
                {brand.is_featured && (
                  <Badge size="2xsmall" color="green">
                    {t("brands.featured")}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
      {(page > 0 || count > PAGE_SIZE) && (
        <LocalizedTablePagination
          count={count}
          pageIndex={page}
          pageSize={PAGE_SIZE}
          pageCount={Math.max(1, Math.ceil(count / PAGE_SIZE))}
          canNextPage={(page + 1) * PAGE_SIZE < count}
          canPreviousPage={page > 0}
          nextPage={() => setPage(page + 1)}
          previousPage={() => setPage(page - 1)}
        />
      )}
    </Container>
  )
}

export const BrandList = () => (
  <LayoutComposer
    widgetsZonePrefix="product_brand.list"
    preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
    disableWidgets
    sections={{
      main: (
        <LayoutComposer.Entry id="BrandListSection">
          <BrandListSection />
        </LayoutComposer.Entry>
      ),
    }}
  />
)
