import { z } from "@medusajs/framework/zod"
import { createFindParams, createSelectParams } from "../../utils/validators"

const StorefrontPageTypeEnum = z.enum(["home", "landing"])

export const StoreGetStorefrontPagesParams = createFindParams({
  limit: 50,
  offset: 0,
}).merge(
  z.object({
    page_type: z
      .union([StorefrontPageTypeEnum, z.array(StorefrontPageTypeEnum)])
      .optional(),
    slug: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export const StoreGetStorefrontPageParams = createSelectParams().merge(
  z.object({
    region_id: z.string().optional(),
    country_code: z.string().optional(),
    currency_code: z.string().optional(),
  })
)
