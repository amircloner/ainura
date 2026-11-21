import { FetchError } from "@medusajs/js-sdk"
import { HttpTypes } from "@medusajs/types"
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

export const storefrontPagesQueryKeys = queryKeysFactory("storefront_pages")
export const storefrontColorsQueryKeys = queryKeysFactory("storefront_colors")

export const useStorefrontPages = (
  query?: HttpTypes.AdminStorefrontPageListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStorefrontPageListResponse,
      FetchError,
      HttpTypes.AdminStorefrontPageListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: storefrontPagesQueryKeys.list(query),
    queryFn: async () => sdk.admin.storefrontPage.list(query),
    ...options,
  })
  return { ...data, ...rest }
}

export const useStorefrontPage = (
  id: string,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStorefrontPageResponse,
      FetchError,
      HttpTypes.AdminStorefrontPageResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: storefrontPagesQueryKeys.detail(id),
    queryFn: async () => sdk.admin.storefrontPage.retrieve(id),
    ...options,
  })
  return { ...data, ...rest }
}

export const useCreateStorefrontPage = (
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontPageResponse,
    FetchError,
    HttpTypes.AdminCreateStorefrontPage
  >
) =>
  useMutation({
    ...options,
    mutationFn: (payload) => sdk.admin.storefrontPage.create(payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useUpdateStorefrontPage = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontPageResponse,
    FetchError,
    HttpTypes.AdminUpdateStorefrontPage
  >
) =>
  useMutation({
    ...options,
    mutationFn: (payload) => sdk.admin.storefrontPage.update(id, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.detail(id),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useDeleteStorefrontPage = (
  id: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontPageDeleteResponse,
    FetchError,
    void
  >
) =>
  useMutation({
    ...options,
    mutationFn: () => sdk.admin.storefrontPage.delete(id),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.detail(id),
        refetchType: "none",
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useCreateStorefrontSection = (
  pageId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontSectionResponse,
    FetchError,
    HttpTypes.AdminCreateStorefrontSection
  >
) =>
  useMutation({
    ...options,
    mutationFn: (payload) =>
      sdk.admin.storefrontPage.createSection(pageId, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.detail(pageId),
      })
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useUpdateStorefrontSection = (
  pageId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontSectionResponse,
    FetchError,
    { sectionId: string; payload: HttpTypes.AdminUpdateStorefrontSection }
  >
) =>
  useMutation({
    ...options,
    mutationFn: ({ sectionId, payload }) =>
      sdk.admin.storefrontPage.updateSection(pageId, sectionId, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.detail(pageId),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useDeleteStorefrontSection = (
  pageId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontSectionDeleteResponse,
    FetchError,
    string
  >
) =>
  useMutation({
    ...options,
    mutationFn: (sectionId) =>
      sdk.admin.storefrontPage.deleteSection(pageId, sectionId),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.detail(pageId),
      })
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useReorderStorefrontSections = (
  pageId: string,
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontPageResponse,
    FetchError,
    HttpTypes.AdminReorderStorefrontSections
  >
) =>
  useMutation({
    ...options,
    mutationFn: (payload) =>
      sdk.admin.storefrontPage.reorderSections(pageId, payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontPagesQueryKeys.detail(pageId),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useStorefrontColors = (
  query?: HttpTypes.AdminStorefrontColorListParams,
  options?: Omit<
    UseQueryOptions<
      HttpTypes.AdminStorefrontColorListResponse,
      FetchError,
      HttpTypes.AdminStorefrontColorListResponse,
      QueryKey
    >,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...rest } = useQuery({
    queryKey: storefrontColorsQueryKeys.list(query),
    queryFn: async () => sdk.admin.storefrontColor.list(query),
    ...options,
  })
  return { ...data, ...rest }
}

export const useUpsertStorefrontColor = (
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontColorResponse,
    FetchError,
    HttpTypes.AdminUpsertStorefrontColor
  >
) =>
  useMutation({
    ...options,
    mutationFn: (payload) => sdk.admin.storefrontColor.upsert(payload),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontColorsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })

export const useDeleteStorefrontColor = (
  options?: UseMutationOptions<
    HttpTypes.AdminStorefrontColorDeleteResponse,
    FetchError,
    string
  >
) =>
  useMutation({
    ...options,
    mutationFn: (id) => sdk.admin.storefrontColor.delete(id),
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({
        queryKey: storefrontColorsQueryKeys.lists(),
      })
      options?.onSuccess?.(data, variables, onMutateResult, context)
    },
  })
