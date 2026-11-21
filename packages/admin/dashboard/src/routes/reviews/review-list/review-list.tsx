import { CORE_LAYOUT_IDS } from "@medusajs/admin-shared"
import { HttpTypes } from "@medusajs/types"
import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { PermissionGuard } from "../../../components/common/permission-guard"
import { LayoutComposer } from "../../../components/layout-composer"
import { LocalizedTablePagination } from "../../../components/localization/localized-table-pagination"
import {
  useDeleteReview,
  useReviews,
  useUpdateReview,
} from "../../../hooks/api/reviews"
import { useDocumentDirection } from "../../../hooks/use-document-direction"
import { useResourcePermissions } from "../../../hooks/use-resource-permissions"

const PAGE_SIZE = 20
const STATUSES = ["pending", "approved", "rejected"] as const
type Status = HttpTypes.AdminProductReview["status"]

const ReviewRow = ({ review }: { review: HttpTypes.AdminProductReview }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const { mutate: updateReview, isPending: isUpdating } = useUpdateReview(
    review.id
  )
  const { mutate: deleteReview, isPending: isDeleting } = useDeleteReview(
    review.id
  )

  const handleStatus = (status: "approved" | "rejected") => {
    updateReview(
      { status },
      {
        onSuccess: () => toast.success(t(`reviews.toasts.${status}`)),
        onError: (error) => toast.error(error.message),
      }
    )
  }

  const handleDelete = async () => {
    const confirmed = await prompt({
      title: t("general.areYouSure"),
      description: t("reviews.deleteWarning"),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (confirmed) {
      deleteReview(undefined, {
        onSuccess: () => toast.success(t("reviews.toasts.deleted")),
        onError: (error) => toast.error(error.message),
      })
    }
  }

  return (
    <li className="flex flex-wrap items-start justify-between gap-4 px-6 py-4">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <Text size="small" weight="plus" className="break-words">
            {review.title || review.customer_name}
          </Text>
          <Badge size="2xsmall" color="blue">
            {t("reviews.rating", { rating: review.rating })}
          </Badge>
          <Badge
            size="2xsmall"
            color={
              review.status === "approved"
                ? "green"
                : review.status === "rejected"
                  ? "red"
                  : "orange"
            }
          >
            {t(`reviews.status.${review.status}`)}
          </Badge>
          {review.verified_purchase && (
            <Badge size="2xsmall" color="purple">
              {t("reviews.verifiedBuyer")}
            </Badge>
          )}
        </div>
        <Text size="xsmall" className="text-ui-fg-subtle break-words">
          {review.title && `${review.customer_name} · `}
          <PermissionGuard
            permission="product:read"
            fallback={review.product?.title ?? review.product_id}
          >
            <Link
              className="hover:underline"
              to={`/products/${review.product_id}`}
            >
              {review.product?.title ?? review.product_id}
            </Link>
          </PermissionGuard>
        </Text>
        <Text
          size="small"
          className="text-ui-fg-subtle break-words whitespace-pre-wrap"
        >
          {review.content}
        </Text>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PermissionGuard permission="product_review:update">
          {review.status !== "approved" && (
            <Button
              size="small"
              variant="secondary"
              disabled={isUpdating || isDeleting}
              onClick={() => handleStatus("approved")}
            >
              {t("reviews.approve")}
            </Button>
          )}
          {review.status !== "rejected" && (
            <Button
              size="small"
              variant="secondary"
              disabled={isUpdating || isDeleting}
              onClick={() => handleStatus("rejected")}
            >
              {t("reviews.reject")}
            </Button>
          )}
        </PermissionGuard>
        <PermissionGuard permission="product_review:delete">
          <Button
            size="small"
            variant="transparent"
            disabled={isUpdating || isDeleting}
            onClick={handleDelete}
          >
            {t("actions.delete")}
          </Button>
        </PermissionGuard>
      </div>
    </li>
  )
}

const ReviewListSection = () => {
  const { t } = useTranslation()
  const direction = useDocumentDirection()
  const statusFilterId = useId()
  const { canRead, isLoading } = useResourcePermissions("product_review")
  const [status, setStatus] = useState<Status | "all">("all")
  const [page, setPage] = useState(0)
  const {
    reviews = [],
    count = 0,
    isPending,
    isError,
    error,
  } = useReviews(
    {
      limit: PAGE_SIZE,
      offset: PAGE_SIZE * page,
      status: status === "all" ? undefined : status,
    },
    { enabled: !isLoading && canRead }
  )

  if (isError) {
    throw error
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
        <div>
          <Heading>{t("reviews.domain")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {t("reviews.description")}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={statusFilterId} className="txt-compact-small">
            {t("fields.status")}
          </label>
          <Select
            dir={direction}
            value={status}
            onValueChange={(value) => {
              setStatus(value as Status | "all")
              setPage(0)
            }}
          >
            <Select.Trigger id={statusFilterId} className="w-32">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="all">{t("general.fullList")}</Select.Item>
              {STATUSES.map((status) => (
                <Select.Item key={status} value={status}>
                  {t(`reviews.status.${status}`)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>
      {isPending || !reviews.length ? (
        <Text
          role="status"
          size="small"
          className="text-ui-fg-subtle px-6 py-8"
        >
          {t(isPending ? "reviews.loading" : "reviews.empty")}
        </Text>
      ) : (
        <ul className="divide-y">
          {reviews.map((review) => (
            <ReviewRow key={review.id} review={review} />
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

export const ReviewList = () => (
  <LayoutComposer
    widgetsZonePrefix="product_review.list"
    preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
    disableWidgets
    sections={{
      main: (
        <LayoutComposer.Entry id="ReviewListSection">
          <ReviewListSection />
        </LayoutComposer.Entry>
      ),
    }}
  />
)
