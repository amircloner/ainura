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
import { productsQueryKeys } from "./products"

const BRAND_QUERY_KEY = "brands" as const
export const brandsQueryKeys = queryKeysFactory(BRAND_QUERY_KEY)

export const useBrand = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      { brand: HttpTypes.AdminBrand },
      FetchError,
      { brand: HttpTypes.AdminBrand },
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.detail(id),
    queryFn: async () => sdk.admin.brand.retrieve(id),
    ...options,
  })

  return { ...data, ...rest }
}

export const useBrands = (
  query?: FindParams & HttpTypes.AdminBrandListParams,
  options?: Omit<
    UseQueryOptions<
      PaginatedResponse<{ brands: HttpTypes.AdminBrand[] }>,
      FetchError,
      PaginatedResponse<{ brands: HttpTypes.AdminBrand[] }>,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: brandsQueryKeys.list(query),
    queryFn: async () => sdk.admin.brand.list(query),
    ...options,
  })

  return { ...data, ...rest }
}

export const useCreateBrand = (
  options?: UseMutationOptions<
    HttpTypes.AdminBrandResponse,
    FetchError,
    HttpTypes.AdminCreateBrand
  >
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) => sdk.admin.brand.create(payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export const useUpdateBrand = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBrandResponse,
    FetchError,
    HttpTypes.AdminUpdateBrand
  >
) => {
  return useMutation({
    ...options,
    mutationFn: (payload) => sdk.admin.brand.update(id, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.details() })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}

export const useDeleteBrand = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminBrandDeleteResponse,
    FetchError,
    void
  >
) => {
  return useMutation({
    ...options,
    mutationFn: () => sdk.admin.brand.delete(id),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: brandsQueryKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: brandsQueryKeys.detail(id),
        refetchType: "none",
      })
      queryClient.invalidateQueries({ queryKey: productsQueryKeys.details() })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
}
