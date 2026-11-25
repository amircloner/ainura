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

export type StoreProductCategoryParamsType = z.infer<
  typeof StoreProductCategoryParams
>
export const StoreProductCategoryParams = createSelectParams().merge(
  z.object({
    include_ancestors_tree: booleanString().optional(),
    include_descendants_tree: booleanString().optional(),
  })
)

const ProductCategoryDisplayTypeSchema = z.enum([
  "default",
  "products",
  "subcategories",
  "both",
])

export const StoreProductCategoriesParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  name: z.union([z.string(), z.array(z.string())]).optional(),
  description: z.union([z.string(), z.array(z.string())]).optional(),
  handle: z.union([z.string(), z.array(z.string())]).optional(),
  display_type: z
    .union([
      ProductCategoryDisplayTypeSchema,
      z.array(ProductCategoryDisplayTypeSchema),
    ])
    .optional(),
  parent_category_id: z.union([z.string(), z.array(z.string())]).optional(),
  external_id: z.union([z.string(), z.array(z.string()), z.null()]).optional(),
  include_ancestors_tree: booleanString().optional(),
  include_descendants_tree: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
  deleted_at: createOperatorMap().optional(),
})

export type StoreProductCategoriesParamsType = z.infer<
  typeof StoreProductCategoriesParams
>
export const StoreProductCategoriesParams = createFindParams({
  offset: 0,
  limit: 50,
})
  .merge(StoreProductCategoriesParamsFields)
  .merge(applyAndAndOrOperators(StoreProductCategoriesParamsFields))
