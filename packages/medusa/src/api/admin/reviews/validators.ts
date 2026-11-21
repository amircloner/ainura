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

export const AdminGetReviewParams = createSelectParams()

export const AdminGetReviewsParamsFields = z.object({
  q: z.string().optional(),
  id: z.union([z.string(), z.array(z.string())]).optional(),
  product_id: z.union([z.string(), z.array(z.string())]).optional(),
  customer_id: z.union([z.string(), z.array(z.string())]).optional(),
  rating: z
    .union([z.coerce.number(), z.array(z.coerce.number())])
    .optional(),
  status: z
    .union([
      z.enum(["pending", "approved", "rejected"]),
      z.array(z.enum(["pending", "approved", "rejected"])),
    ])
    .optional(),
  is_recommended: booleanString().optional(),
  verified_purchase: booleanString().optional(),
  created_at: createOperatorMap().optional(),
  updated_at: createOperatorMap().optional(),
})

export type AdminGetReviewsParamsType = z.infer<typeof AdminGetReviewsParams>
export const AdminGetReviewsParams = createFindParams({
  offset: 0,
  limit: 20,
  order: "-created_at",
})
  .merge(AdminGetReviewsParamsFields)
  .merge(applyAndAndOrOperators(AdminGetReviewsParamsFields))

export type AdminUpdateReviewType = z.infer<typeof UpdateReview>
export const UpdateReview = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  title: z.string().nullish(),
  content: z.string().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  is_recommended: z.boolean().optional(),
  verified_purchase: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
})

export const AdminUpdateReview = WithAdditionalData(UpdateReview)
