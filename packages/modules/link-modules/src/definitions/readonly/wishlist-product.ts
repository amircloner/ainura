import { ModuleJoinerConfig } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export const WishlistProduct: ModuleJoinerConfig = {
  isLink: true,
  isReadOnlyLink: true,
  extends: [
    {
      serviceName: Modules.CUSTOMER,
      entity: "CustomerWishlistItem",
      relationship: {
        serviceName: Modules.PRODUCT,
        entity: "Product",
        primaryKey: "id",
        foreignKey: "product_id",
        alias: "product",
        args: {
          methodSuffix: "Products",
        },
      },
    },
    {
      serviceName: Modules.CUSTOMER,
      entity: "CustomerWishlistItem",
      relationship: {
        serviceName: Modules.PRODUCT,
        entity: "ProductVariant",
        primaryKey: "id",
        foreignKey: "variant_id",
        alias: "variant",
        args: {
          methodSuffix: "ProductVariants",
        },
      },
    },
  ],
}
