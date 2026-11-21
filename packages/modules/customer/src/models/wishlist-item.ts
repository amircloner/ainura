import { model } from "@medusajs/framework/utils"
import Customer from "./customer"

const CustomerWishlistItem = model
  .define("CustomerWishlistItem", {
    id: model.id({ prefix: "cwish" }).primaryKey(),
    product_id: model.text(),
    variant_id: model.text().nullable(),
    metadata: model.json().nullable(),
    customer: model.belongsTo(() => Customer, {
      mappedBy: "wishlist_items",
    }),
  })
  .indexes([
    {
      name: "IDX_wishlist_customer_product_unique",
      on: ["customer_id", "product_id"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default CustomerWishlistItem
