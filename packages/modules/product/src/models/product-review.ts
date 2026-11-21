import { model } from "@medusajs/framework/utils"
import Product from "./product"

const ProductReview = model
  .define("ProductReview", {
    id: model.id({ prefix: "prev" }).primaryKey(),
    customer_id: model.text().nullable(),
    customer_name: model.text(),
    rating: model.number(),
    title: model.text().searchable().nullable(),
    content: model.text().searchable(),
    pros: model.json().nullable(),
    cons: model.json().nullable(),
    is_recommended: model.boolean().default(true),
    verified_purchase: model.boolean().default(false),
    status: model.enum(["pending", "approved", "rejected"]).default("approved"),
    metadata: model.json().nullable(),
    product: model.belongsTo(() => Product, {
      mappedBy: "reviews",
    }),
  })
  .checks([
    {
      name: "product_review_rating_check",
      expression: ({ rating }) => `${rating} between 1 and 5`,
    },
  ])
  .indexes([
    {
      name: "IDX_review_customer_id",
      on: ["customer_id"],
      unique: false,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_review_status",
      on: ["status"],
      unique: false,
      where: "deleted_at IS NULL",
    },
  ])

export default ProductReview
