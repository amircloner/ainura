import { z } from "@medusajs/framework/zod"
import {
  applyAndAndOrOperators,
  booleanString,
} from "../../utils/common-validators"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
  WithAdditionalData,
} from "../../utils/validators"

export const AdminGetBrandParams = createSelectParams()

export const AdminGetBrandsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  is_featured: booleanString().optional(),
  country: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type AdminGetBrandsParamsType = z.infer<typeof AdminGetBrandsParams>
export const AdminGetBrandsParams = createFindParams({
  offset: 0,
  limit: 20,
})
  .merge(AdminGetBrandsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetBrandsParamsFields))

export type AdminCreateBrandType = z.infer<typeof CreateBrand>
export const CreateBrand = z.object({
  name: z.string(),
  handle: z.string().optional(),
  logo_url: z.string().nullish(),
  banner_url: z.string().nullish(),
  description: z.string().nullish(),
  is_featured: z.boolean().optional().default(false),
  country: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminCreateBrand = WithAdditionalData(CreateBrand)

export type AdminUpdateBrandType = z.infer<typeof UpdateBrand>
export const UpdateBrand = z.object({
  name: z.string().optional(),
  handle: z.string().optional(),
  logo_url: z.string().nullish(),
  banner_url: z.string().nullish(),
  description: z.string().nullish(),
  is_featured: z.boolean().optional(),
  country: z.string().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminUpdateBrand = WithAdditionalData(UpdateBrand)
