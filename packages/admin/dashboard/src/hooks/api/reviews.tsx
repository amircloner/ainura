import { FetchError } from "@medusajs/js-sdk"
import { FindParams, HttpTypes, PaginatedResponse } from "@medusajs/types"
import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery,
} from "@tanstack/react-query"
import { sdk } from "../../lib/client"
import { queryClient } from "../../lib/query-client"
import { queryKeysFactory } from "../../lib/query-key-factory"

const REVIEW_QUERY_KEY = "reviews" as const
export const reviewsQueryKeys = queryKeysFactory(REVIEW_QUERY_KEY)

export const useReview = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      { review: HttpTypes.AdminProductReview },
      FetchError,
      { review: HttpTypes.AdminProductReview },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.detail(id),
    queryFn: async () => sdk.admin.review.retrieve(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useReviews = (
  query?: FindParams & HttpTypes.AdminProductReviewListParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{ reviews: HttpTypes.AdminProductReview[] }>,
      FetchError,
      PaginatedResponse<{ reviews: HttpTypes.AdminProductReview[] }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: reviewsQueryKeys.list(query),
    queryFn: async () => sdk.admin.review.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useUpdateReview = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductReviewResponse,
    FetchError,
    HttpTypes.AdminUpdateProductReview
  >
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) => sdk.admin.review.update(id, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export const useDeleteReview = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminProductReviewDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    ...options,
    mutationFn: () => sdk.admin.review.delete(id),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.detail(id) })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
