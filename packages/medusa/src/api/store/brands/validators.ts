import { z } from "@medusajs/framework/zod"
import {
  applyAndAndOrOperators,
  booleanString,
} from "../../utils/common-validators"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../utils/validators"

export const StoreGetBrandParams = createSelectParams()

export const StoreGetBrandsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  is_featured: booleanString().optional(),
  country: z.union([z.string(), z.array(z.string())]).optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type StoreGetBrandsParamsType = z.infer<typeof StoreGetBrandsParams>
export const StoreGetBrandsParams = createFindParams({
  offset: 0,
  limit: 20,
  order: "name",
})
  .merge(StoreGetBrandsParamsFields)
  .merge(applyAndAndOrOperators(StoreGetBrandsParamsFields))
