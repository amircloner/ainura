import { z } from "@medusajs/framework/zod"
import { booleanString } from "../../../../utils/common-validators"
import {
  createFindParams,
  createSelectParams,
} from "../../../../utils/validators"

export const StoreGetProductReviewParams = createSelectParams()

export const StoreGetProductReviewsParams = createFindParams({
  offset: 0,
  limit: 20,
  order: "-created_at",
}).merge(
  z.object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    is_recommended: booleanString().optional(),
    verified_purchase: booleanString().optional(),
  })
)

export type StoreCreateProductReviewType = z.infer<
  typeof StoreCreateProductReview
>
export const StoreCreateProductReview = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().nullish(),
  content: z.string().trim().min(1),
  customer_name: z.string().trim().min(1).optional(),
  pros: z.array(z.string()).nullish(),
  cons: z.array(z.string()).nullish(),
  is_recommended: z.boolean().optional().default(true),
})
