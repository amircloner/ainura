# Plan: Medusa Fashion Commerce Extensions & Persian RTL Storefront (Ainura)

## 1. Goal & Constraints
- **Objective**: Extend Medusa Core (`packages/*`) with first-class fashion commerce capabilities (Brands, Product Reviews & Ratings, Customer Wishlists, and structured Fashion Product Metadata including technical specifications, size guides, and seller/warranty attributes) and deliver a complete Persian RTL Next.js storefront (`apps/storefront` under the **Ainura / آینورا** brand).
- **Hard Constraint**: Zero mention of the reference site's name or brand anywhere in code, package names, comments, seed data, or UI.
- **Conventions**:
  - Follow Medusa v2 patterns: DML models (`model.define`), `MedusaService`, `yarn migration:create` for migrations, workflows in `@medusajs/core-flows`, explicit `allowed` fields on all `/store/*` routes via `buildAllowedFields`, RBAC `authorize()` on all `/admin/*` routes, `CORE_POLICY_RESOURCES` + `PERMISSION_GROUPS` sync, `en.json` + `yarn i18n:schema` in `@medusajs/dashboard`, and package `AGENTS.md`/`README.md` updates.

---

## 2. Backend Architecture (`packages/*`)

### Phase 1: Core Types (`packages/core/types`)
1. **Product Domain (`src/product/`)**:
   - `common.ts`: Add `ProductBrandDTO`, `FilterableProductBrandProps`, `ProductReviewDTO`, `FilterableProductReviewProps`, `ProductReviewStatus` (`"pending" | "approved" | "rejected"`), `ProductReviewStatsDTO`, and `ProductFashionMetadata` (typed structure for `specifications: Array<{ label: string; value: string }>`, `size_guide: { columns: string[]; rows: string[][]; measurement_note?: string }`, `warranty?: string`, `seller_name?: string`, `lead_time_days?: number`, `return_policy?: string`, `product_code?: string`).
   - `mutations.ts`: Add `CreateProductBrandDTO`, `UpdateProductBrandDTO`, `CreateProductReviewDTO`, `UpdateProductReviewDTO`.
   - `service.ts`: Extend `IProductModuleService` with brand and review CRUD method signatures.
2. **Customer Domain (`src/customer/`)**:
   - `common.ts`, `mutations.ts`, `service.ts`: Add `CustomerWishlistItemDTO`, `FilterableCustomerWishlistItemProps`, `CreateCustomerWishlistItemDTO`, and wishlist service methods on `ICustomerModuleService`.
3. **HTTP Types (`src/http/`)**:
   - Add `StoreBrand`, `AdminBrand`, `StoreProductReview`, `StoreProductReviewStats`, `AdminProductReview`, `StoreWishlistItem` payloads/queries/responses under `src/http/product/` and `src/http/customer/`.
   - Extend `StoreProduct` and `AdminProduct` with optional `brand?: StoreBrand | null`, `brand_id?: string | null`, and `reviews?: StoreProductReview[]`.
4. **RBAC (`src/rbac/common.ts`)**:
   - Add `"product_brand"` and `"product_review"` to `CORE_POLICY_RESOURCES`.

### Phase 2: Data Models & Migrations (`packages/modules/*`)
1. **Product Module (`packages/modules/product`)**:
   - `src/models/product-brand.ts`: Define `ProductBrand` (`id` prefix `pbrand`, `name` searchable/translatable, `handle` unique index, `logo_url` nullable, `banner_url` nullable, `description` searchable/translatable/nullable, `is_featured` boolean default `false`, `country` nullable, `metadata` json nullable, `products` `hasMany(() => Product)`).
   - `src/models/product-review.ts`: Define `ProductReview` (`id` prefix `prev`, `product` `belongsTo(() => Product)`, `customer_id` text nullable, `customer_name` text, `rating` number, `title` text nullable, `content` text searchable, `pros` json nullable, `cons` json nullable, `is_recommended` boolean default `true`, `verified_purchase` boolean default `false`, `status` enum `["pending", "approved", "rejected"]` default `"approved"`, `metadata` json nullable).
   - `src/models/product.ts`: Add `brand: model.belongsTo(() => ProductBrand, { mappedBy: "products" }).nullable()`, `reviews: model.hasMany(() => ProductReview, { mappedBy: "product" })`, and index `IDX_product_brand_id`.
   - Export new models from `src/models/index.ts`, register in `src/services/product-module-service.ts`, and run `cd packages/modules/product && yarn migration:create`.
2. **Customer Module (`packages/modules/customer`) & Link Modules (`packages/modules/link-modules`)**:
   - `packages/modules/customer/src/models/wishlist-item.ts`: Define `CustomerWishlistItem` (`id` prefix `cwish`, `customer` `belongsTo(() => Customer)`, `product_id` text, `variant_id` text nullable, `metadata` json nullable) with unique partial index on `["customer_id", "product_id"]` where `deleted_at IS NULL`.
   - Update `packages/modules/customer/src/models/customer.ts` (`wishlist_items` hasMany with cascade delete), export in `src/models/index.ts`, register in `CustomerModuleService`, and run `cd packages/modules/customer && yarn migration:create`.
   - `packages/modules/link-modules/src/definitions/readonly/wishlist-product.ts`: Add read-only link between `CustomerWishlistItem.product_id` and `Product.id`.

### Phase 3: Workflows (`packages/core/core-flows`)
1. **Product Brand Workflows (`src/product/steps/` & `src/product/workflows/`)**:
   - `createProductBrandsWorkflow`, `updateProductBrandsWorkflow`, `deleteProductBrandsWorkflow` with compensation rollback.
2. **Product Review Workflows (`src/product/steps/` & `src/product/workflows/`)**:
   - `createProductReviewsWorkflow` (validates rating 1..5, checks verified purchase via customer orders), `updateProductReviewsWorkflow`, `deleteProductReviewsWorkflow`.
3. **Customer Wishlist Workflows (`src/customer/steps/` & `src/customer/workflows/`)**:
   - `createWishlistItemWorkflow`, `deleteWishlistItemWorkflow`.

### Phase 4: Store & Admin API Routes (`packages/medusa/src/api`)
1. **Store Routes**:
   - `/store/brands` (`GET`) and `/store/brands/[id]` (`GET`) with explicit `allowed` fields in `query-config.ts` via `buildAllowedFields`.
   - `/store/products/[id]/reviews` (`GET` list approved reviews + stats summary, `POST` authenticated customer review submission) with `query-config.ts` and Zod validators.
   - `/store/customers/me/wishlist` (`GET`, `POST`) and `/store/customers/me/wishlist/[id]` (`DELETE`) guarded by `authenticate("customer", ["session", "bearer"])` and explicit `allowed` fields.
   - Extend `/store/products/query-config.ts` and `validators.ts` to allow `brand_id`, `*brand`, `brand.id`, `brand.name`, `brand.handle`, `brand.logo_url`, `brand.is_featured`, and filtering by `brand_id`.
2. **Admin Routes**:
   - `/admin/brands` (`GET`, `POST`) and `/admin/brands/[id]` (`GET`, `POST`, `DELETE`) guarded with `authorize([{ resource: "product_brand", operation }])`.
   - `/admin/reviews` (`GET`) and `/admin/reviews/[id]` (`GET`, `POST`, `DELETE`) guarded with `authorize([{ resource: "product_review", operation }])`.
   - Register middleware arrays in `packages/medusa/src/api/middlewares.ts`.

### Phase 5: JS SDK & Admin Dashboard (`packages/core/js-sdk`, `packages/admin/dashboard`)
1. **JS SDK (`packages/core/js-sdk`)**:
   - Add `store.brand`, `store.review`, `store.wishlist` methods in `src/store/`.
   - Add `admin.brand`, `admin.review` methods in `src/admin/`.
2. **Admin Dashboard (`packages/admin/dashboard`)**:
   - Add `"product_brand"` and `"product_review"` to `PERMISSION_GROUPS` in `src/routes/roles/common/constants.ts`.
   - Add translation keys in `src/i18n/translations/en.json` and run `yarn i18n:schema`.
   - Add hooks `src/hooks/api/brands.tsx` and `src/hooks/api/reviews.tsx`.
   - Add Admin pages `src/routes/brands/` (list, create/edit drawer, detail) and `src/routes/reviews/` (list, status moderation).

---

## 3. Persian RTL Fashion Storefront (`apps/storefront`)

### Tech Stack & Design System
- **Framework**: Next.js (App Router, TypeScript, Tailwind CSS), RTL (`dir="rtl" lang="fa"`), `Vazirmatn` font, Persian digit & Toman (`تومان`) price formatter.
- **Aesthetic**: High-fashion minimal monochrome (sharp black `#111111` primary CTAs, warm off-white `#FAFAFA` surfaces, coral-red `#E6123D` discount badges, sticky header with glass blur, clean bordered specification grids).
- **Data Layer (`src/lib/medusa.ts` & `src/lib/seed-data.ts`)**:
  - Uses `@medusajs/js-sdk` against `NEXT_PUBLIC_MEDUSA_BACKEND_URL`.
  - Includes a comprehensive built-in Persian fashion dataset (including the **کفش زنانه چرم یلسان مدل کلارا کد KLR-601** with colors زرشکی/مشکی/عسلی, sizes 36–41, natural cow leather specs, EU/cm size guide table, verified reviews, and 16+ fashion products across زنانه، مردانه، بچگانه، زیبایی و سلامت) that serves both as the Medusa database seed script (`scripts/seed-fashion.ts`) and as a seamless runtime fallback when the backend server is offline.

### Storefront Pages & Interactive Features
1. **Global Header, Mega-Menu & Search (`src/components/layout/`)**:
   - Top announcement bar, brand logo (**آینورا | AINURA**), instant search modal with product/brand/category suggestions, mega-menu categories (`زنانه`, `مردانه`, `بچگانه`, `زیبایی و سلامت`, `برندها`, `فروش ویژه`), account link, wishlist counter, and slide-over Cart Drawer.
2. **Homepage (`src/app/page.tsx`)**:
   - Full-width editorial hero carousel.
   - Quick category tiles (`زنانه`, `مردانه`, `بچگانه`, `کیف و کفش`, `اکسسوری`, `زیبایی`).
   - Timed Flash Sale section (`فروش ویژه شگفت‌انگیز`) with live countdown timer and discount badges.
   - Featured Brands showcase (`برندهای برگزیده`: یلسان، درسا، چرم مشهد، نوین چرم، ال سی من، سارک) linking to `/brands/[handle]`.
   - New Arrivals & Best Sellers product carousels with quick size preview on hover.
3. **Product Listing & Search Page (`src/app/products/page.tsx`, `src/app/categories/[handle]/page.tsx`, `src/app/brands/[handle]/page.tsx`)**:
   - Sticky RTL filter sidebar: Category tree, Brand multi-select with internal search, Size grid filter (`36`–`44`, `S`–`XXL`), Color swatches filter, Price range filter (Toman), `فقط کالاهای موجود` toggle, `فقط کالاهای تخفیف‌دار` toggle.
   - Sort toolbar (`پربازدیدترین`, `جدیدترین`, `پرفروش‌ترین`, `ارزان‌ترین`, `گران‌ترین`, `بیشترین تخفیف`) + active filter chips + URL query sync.
4. **Product Detail Page — PDP (`src/app/products/[handle]/page.tsx`)**:
   - Breadcrumb navigation (`خانه / زنانه / کفش زنانه / کفش روزمره / کفش زنانه چرم یلسان مدل کلارا کد KLR-601`).
   - **Gallery**: Main image with hover magnifier zoom, thumbnail gallery strip, full-screen lightbox modal, share & wishlist toggle buttons.
   - **Product Configuration**:
     - Brand link badge + official authenticity tag (`کالای اصل`).
     - Rating stars, review count, and buyer recommendation badge (`۸۸٪ از خریداران این کالا را پیشنهاد کرده‌اند`).
     - Color selector with visual swatches and selected color label.
     - Size selector with stock status per variant + **Interactive Size Guide Modal (`راهنمای سایز`)** with foot measurement instructions and CM-to-EU conversion table.
   - **Purchase & Seller Box**:
     - Seller card (`فروشنده رسمی برند`, `گارانتی اصالت و سلامت فیزیکی کالا`, `ارسال سریع`, `۷ روز ضمانت بازگشت`).
     - Original price, discounted price in Toman, discount percentage badge, and `افزودن به سبد خرید` CTA synced with Cart state.
   - **Sticky Section Tabs**:
     - `مشخصات و ویژگی‌ها`: Full key-value specification table (جنس رویه، جنس آستر، جنس زیره، ارتفاع پاشنه، نوع کفی، فرم پنجه، نحوه بسته شدن، کشور تولیدکننده).
     - `دیدگاه و امتیاز کاربران`: Average rating score, 5-star distribution bars, recommendation rate, verified buyer comments with pros/cons, and interactive **ثبت دیدگاه** form (`POST /store/products/:id/reviews`).
     - `محصولات مشابه`: Carousel of related products in the same category/brand.
5. **Cart & Checkout Flow (`src/app/cart/page.tsx`, `src/app/checkout/page.tsx`)**:
   - Cart item management (variant color/size badge, quantity stepper, remove item, coupon code input, free-shipping progress bar, Toman price summary).
   - Multi-step Checkout: Shipping address form (استان، شهر، آدرس کامل، کد پستی ۱۰ رقمی، گیرنده و موبایل), shipping method selection (ارسال عادی / ارسال اکسپرس), payment method selection, and order completion generating an order confirmation code.
6. **Customer Auth, Profile & Wishlist (`src/app/account/page.tsx`, `src/app/wishlist/page.tsx`)**:
   - Login/Register modal & page, Order history list, Saved addresses, and persistent Wishlist page with direct "Move to Cart" action.

---

## 4. Verification & Validation Plan
1. **Migrations & Unit Tests**:
   - Run `yarn migration:create` in `packages/modules/product` and `packages/modules/customer`.
   - Run unit tests in `packages/modules/product`, `packages/modules/customer`, `packages/medusa` (`middlewares.spec.ts`), and `packages/admin/dashboard` (`utils.spec.ts` for `CORE_POLICY_RESOURCES` and `validate-translations.spec.ts` after `yarn i18n:schema`).
2. **Typecheck & Build**:
   - Build modified core packages (`@medusajs/types`, `@medusajs/utils`, `@medusajs/product`, `@medusajs/customer`, `@medusajs/link-modules`, `@medusajs/core-flows`, `@medusajs/js-sdk`, `@medusajs/medusa`, `@medusajs/dashboard`).
   - Run `next build` / `tsc --noEmit` in `apps/storefront` and verify all routes (`/`, `/products`, `/products/[handle]`, `/brands/[handle]`, `/categories/[handle]`, `/cart`, `/checkout`, `/wishlist`, `/account`).
3. **Changeset & Package Docs**:
   - Add `.changeset/fashion-commerce-brands-reviews-wishlist.md` (`patch`).
   - Update `AGENTS.md` and `README.md` in modified packages.
