export default `
enum ProductStatus {
  draft
  proposed
  published
  rejected
}

type Product {
  id: ID!
  title: String!
  handle: String!
  subtitle: String
  description: String
  is_giftcard: Boolean!
  status: ProductStatus!
  thumbnail: String
  width: Float
  weight: Float
  length: Float
  height: Float
  origin_country: String
  hs_code: String
  mid_code: String
  material: String
  collection: ProductCollection
  collection_id: String
  brand: ProductBrand
  brand_id: String
  reviews: [ProductReview]
  categories: [ProductCategory]
  type: ProductType
  type_id: String
  tags: [ProductTag!]!
  variants: [ProductVariant!]!
  options: [ProductOption!]!
  images: [ProductImage!]!
  discountable: Boolean
  external_id: String
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
  metadata: JSON
}

type ProductVariant {
  id: ID!
  title: String!
  sku: String
  barcode: String
  ean: String
  upc: String
  allow_backorder: Boolean!
  manage_inventory: Boolean!
  requires_shipping: Boolean!
  hs_code: String
  origin_country: String
  mid_code: String
  material: String
  weight: Float
  length: Float
  height: Float
  width: Float
  options: [ProductOptionValue!]!
  images: [ProductImage!]!
  thumbnail: String
  metadata: JSON
  product: Product
  product_id: String
  variant_rank: Int
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

enum ProductCategoryDisplayType {
  default
  products
  subcategories
  both
}

type ProductCategory {
  id: ID!
  name: String!
  description: String!
  handle: String!
  thumbnail: String
  display_type: ProductCategoryDisplayType!
  mpath: String!
  is_active: Boolean!
  is_internal: Boolean!
  rank: Int!
  metadata: JSON
  parent_category: ProductCategory
  parent_category_id: String
  category_children: [ProductCategory!]!
  products: [Product!]!
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductTag {
  id: ID!
  value: String!
  handle: String
  description: String!
  metadata: JSON
  products: [Product]
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductCollection {
  id: ID!
  title: String!
  handle: String!
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
  products: [Product]
}

type ProductType {
  id: ID!
  value: String!
  metadata: JSON
  products: [Product]
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductOption {
  id: ID!
  title: String!
  is_exclusive: Boolean!
  products: [Product!]!
  values: [ProductOptionValue!]!
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductImage {
  id: ID!
  url: String!
  rank: Int!
  metadata: JSON
  product: Product
  product_id: String
  variants: [ProductVariant]
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductOptionValue {
  id: ID!
  value: String!
  option: ProductOption
  option_id: String
  variants: [ProductVariant]
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductVariantProductImage {
  id: ID!
  variant: ProductVariant!
  variant_id: String!
  image: ProductImage!
  image_id: String!
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

type ProductBrand {
  id: ID!
  name: String!
  handle: String!
  logo_url: String
  banner_url: String
  description: String
  is_featured: Boolean!
  country: String
  metadata: JSON
  products: [Product]
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

enum ProductReviewStatus {
  pending
  approved
  rejected
}

type ProductReview {
  id: ID!
  product: Product
  product_id: String!
  customer_id: String
  customer_name: String!
  rating: Int!
  title: String
  content: String!
  pros: JSON
  cons: JSON
  is_recommended: Boolean!
  verified_purchase: Boolean!
  status: ProductReviewStatus!
  metadata: JSON
  created_at: DateTime!
  updated_at: DateTime!
  deleted_at: DateTime
}

`
