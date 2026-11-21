# Plan: Dynamic Storefront CMS, Full DB Seeding & Medusa Admin Management

## 1. Goal & Scope
Move all currently hardcoded storefront data into PostgreSQL and make every non-static piece manageable from the Medusa Admin Dashboard, with `apps/storefront` running **100% DB-only** (no runtime hardcoded fallback data).

- **Static (explicitly unchanged)**: Storefront Header (`src/components/layout/header.tsx` + static mega-menu links) and Footer (`src/components/layout/footer.tsx`).
- **Dynamic in DB + Admin**:
  1. All **168 products**, variants, prices, sale price lists, inventory, images, categories, **60 brands**, **reviews**, and structured **fashion metadata** (specs, size guide, seller name/stats, warranty, lead time, return policy, promo badge, recommended products).
  2. All **Storefront Pages & Ordered Sections/Widgets** (`home` with its 12 widgets, `jackets` landing with its 5 sections, and all additional `/landings/[slug]` pages) with **hybrid product selection** (manual `product_ids` and/or dynamic filters by `category_id`, `brand_id`, `collection_id`, `on_sale`, `limit`).
  3. All **79 color swatch hex codes** (`StorefrontColor`).
- **Seed Scope**: Replace the old 17-item Ainura demo seed with the full Digistyle dataset (168 products, 60 brands, categories, reviews, 79 colors, `home` page, `jackets` + banner landing pages).

---

## 2. Backend Data Models & Migrations

### 2.1 Core Types (`packages/core/types`)
1. **Product Metadata (`src/product/common.ts`)**:
   - Extend `ProductFashionMetadata` with optional:
     - `seller_stats?: { stars?: number; ship_on_time?: number; no_return?: number; registration_date?: string }`
     - `promo_badge?: string`
     - `recommended_product_ids?: string[]`
2. **Storefront Content Types (`src/store/common.ts`, `mutations.ts`, `service.ts`)**:
   - Add `StorefrontPageType` (`"home" | "landing"`), `StorefrontSectionType` (`"hero_banner" | "category_row" | "brand_marquee" | "amazing_carousel" | "tab_carousel" | "simple_carousel" | "two_banner" | "four_banner" | "trust_badges"`).
   - Add `StorefrontProductSource` (`{ mode: "manual" | "filter" | "hybrid"; product_ids?: string[]; category_id?: string | null; brand_id?: string | null; collection_id?: string | null; on_sale?: boolean; sort?: "newest" | "discount" | "price_asc" | "price_desc"; limit?: number }`).
   - Add `StorefrontPageDTO`, `StorefrontSectionDTO`, `StorefrontColorDTO`, filterable props, create/update DTOs, and extend `IStoreModuleService`.
3. **HTTP Types (`src/http/store/`)**:
   - Add Admin & Store request/response/query types for `storefront-pages`, `storefront-sections`, and `storefront-colors` (including resolved `products` on store section responses).
4. **RBAC (`src/rbac/common.ts`)**:
   - Add `"storefront_page"` to `CORE_POLICY_RESOURCES` (governs `/admin/storefront-pages`, sections, and `/admin/storefront-colors`).

### 2.2 DML Models & Migration (`packages/modules/store`)
Using `@medusajs/store` keeps the models loaded by default in every Medusa app with no extra `medusa-config.ts` registration.

1. `src/models/storefront-page.ts` (`StorefrontPage`, prefix `sfpage`):
   - `id`, `slug` (unique partial index where `deleted_at IS NULL`), `title` (searchable/translatable), `subtitle` (nullable), `page_type` (`enum ["home", "landing"]` default `"landing"`), `is_active` (`boolean` default `true`), `metadata` (`json` nullable), `sections` (`hasMany(() => StorefrontSection)` with cascade delete).
2. `src/models/storefront-section.ts` (`StorefrontSection`, prefix `sfsec`):
   - `id`, `page` (`belongsTo(() => StorefrontPage)`), `type` (`enum` of the 9 widget types), `title` (nullable), `href` (nullable), `rank` (`number` default `0`), `is_active` (`boolean` default `true`), `config` (`json` default `{}` — slides, tiles, brand items, reverse flag, `end_date_time`, `source: StorefrontProductSource`, or `tabs: Array<{ title, href, source }>`), index on `["page_id", "rank"]`.
3. `src/models/storefront-color.ts` (`StorefrontColor`, prefix `sfcol`):
   - `id`, `name` (unique partial index where `deleted_at IS NULL`), `hex_code` (`text`), `metadata` (`json` nullable).
4. Register all three models in `src/models/index.ts`, `src/services/store-module-service.ts`, and `src/joiner-config.ts`.
5. Generate migration via `cd packages/modules/store && yarn migration:create` (never hand-write).

---

## 3. Workflows (`packages/core/core-flows`)
Create steps with compensation actions and workflows under `src/store/`:
- `createStorefrontPagesWorkflow`, `updateStorefrontPagesWorkflow`, `deleteStorefrontPagesWorkflow`
- `createStorefrontSectionsWorkflow`, `updateStorefrontSectionsWorkflow`, `deleteStorefrontSectionsWorkflow`, `reorderStorefrontSectionsWorkflow`
- `upsertStorefrontColorsWorkflow`, `deleteStorefrontColorsWorkflow`
- Export from `src/store/index.ts`.

---

## 4. API Routes & Middlewares (`packages/medusa/src/api`)

### 4.1 Admin Routes (RBAC-guarded via `authorize([{ resource: "storefront_page", operation }])`)
- `GET/POST /admin/storefront-pages`
- `GET/POST/DELETE /admin/storefront-pages/:id`
- `POST /admin/storefront-pages/:id/sections`
- `POST/DELETE /admin/storefront-pages/:id/sections/:section_id`
- `POST /admin/storefront-pages/:id/sections/reorder` (accepts ordered `section_ids: string[]`)
- `GET/POST /admin/storefront-colors`
- `DELETE /admin/storefront-colors/:id`
- Zod validators (`validators.ts`), `query-config.ts`, and middleware registration in `packages/medusa/src/api/middlewares.ts`.

### 4.2 Store Routes (Public, explicit `allowed` fields via `buildAllowedFields`)
- `GET /store/storefront-pages` — lists active pages (`id`, `slug`, `title`, `subtitle`, `page_type`).
- `GET /store/storefront-pages/:slug` — returns active page with active `sections` ordered by `rank`, resolving products for `amazing_carousel`, `simple_carousel`, and each tab of `tab_carousel`:
  - Uses `store/utils/visible-products.ts` so only published, sales-channel-visible products with region calculated prices are returned.
  - Supports `mode: "manual"` (ordered by `product_ids`), `mode: "filter"` (`category_id`, `brand_id`, `collection_id`, `on_sale`, `sort`, `limit`), and `mode: "hybrid"` (manual IDs first, backfilled by filter up to `limit`).
- `GET /store/storefront-colors` — returns `{ colors: Array<{ id, name, hex_code }> }`.

---

## 5. JS SDK & Admin Dashboard

### 5.1 JS SDK (`packages/core/js-sdk`)
- Add `sdk.admin.storefrontPage` and `sdk.admin.storefrontColor` in `src/admin/`.
- Add `sdk.store.storefrontPage` and `sdk.store.storefrontColor` in `src/store/`.

### 5.2 Admin Dashboard (`packages/admin/dashboard`)
1. **RBAC & i18n**:
   - Add `"storefront_page"` to `PERMISSION_GROUPS` (`store` group) in `src/routes/roles/common/constants.ts`.
   - Add all new translation keys in `src/i18n/translations/en.json` and run `cd packages/admin/dashboard && yarn i18n:schema`.
2. **API Hooks**:
   - `src/hooks/api/storefront-pages.tsx` and `src/hooks/api/storefront-colors.tsx`.
3. **Storefront Pages Management (`src/routes/storefront-pages/`)**:
   - Register `/storefront-pages` in `get-route.map.tsx` and sidebar (`main-layout.tsx`) gated by `storefront_page:read`.
   - **List Page**: Displays Home & Landing pages with slug, type badge, active status, section count, and "Create Page" drawer.
   - **Page Detail & Visual Section Builder (`/storefront-pages/:id`)**:
     - Edit page metadata (`title`, `subtitle`, `slug`, `is_active`).
     - Ordered section list with up/down reorder buttons, active toggle, edit drawer, delete action, and "+ Add Section" drawer.
     - Structured form editors per widget type (no raw JSON editing):
       - Banner/Image widgets (`hero_banner`, `category_row`, `brand_marquee`, `two_banner`, `four_banner`, `trust_badges`): repeatable item rows with image URL + live thumbnail preview, mobile image URL (where applicable), title/alt, link `href`, `reverse` toggle.
       - Product Carousel widgets (`amazing_carousel`, `simple_carousel`, `tab_carousel`): title, `href`, optional `end_date_time` (amazing), tab manager (`tab_carousel`), and a reusable **ProductSourcePicker** (mode selector: Manual / Filter / Hybrid, multi-select product combobox, category/brand/collection comboboxes, on-sale toggle, sort, limit).
   - **Colors Subpage (`/storefront-pages/colors`)**: Searchable list of color names + hex color swatches with create/edit/delete drawers.
4. **Product Fashion Metadata Editor (`src/routes/products/product-detail/`)**:
   - Add a `ProductFashionSection` + edit drawer on Product Detail for visual editing of `product_code`, `seller_name`, `seller_stats`, `warranty`, `lead_time_days`, `return_policy`, `promo_badge`, `specifications` rows, `size_guide` table, and `recommended_product_ids` picker (writes to `product.metadata` via `useUpdateProduct`).

---

## 6. Database Seed Script (`scripts/`)
1. Move the captured Digistyle dataset out of `apps/storefront/src/lib/digistyle-data.ts` into `scripts/fixtures/digistyle-fixture.ts` (seed-only; never imported by `apps/storefront`).
2. Update `scripts/seed-fashion.ts` to idempotently seed the complete Digistyle dataset (replacing the 17 old Ainura demo products):
   - Region (`irr`), stock location, shipping profile, sales channel link.
   - Category tree (`womens-apparel`, `mens-apparel`, `kids-apparel`, `personal-appliance`, `sport-entertainment`, `gold-silver`, jacket/coat subcategories).
   - All 60 `ProductBrand` records.
   - All 168 `Product` records with options (`Color`, `Size`), variants, images, inventory levels, sale `PriceList` prices, and full `ProductFashionMetadata` (remapping `recommended_product_ids` on product `22797531` to the created Medusa `prod_*` IDs).
   - Verified `ProductReview` entries for product `22797531`.
   - All 79 `StorefrontColor` records.
   - `StorefrontPage` `"home"` with all 12 ordered `StorefrontSection`s (remapping widget product/category/brand links to real Medusa IDs).
   - `StorefrontPage` `"jackets"` (5 sections) plus active landing pages for all home banner slugs (`autumn-trends`, `turk-brands`, `orginal-shoes`, `leather-wear`, `sweaters`, `trousers`, `bag-category`, `watches-campaign`, `tshirt`, `boots`, `accessories-aban`, `paydayaban-campaing`, `gold-brands`, `vitamins-supplements-brands`, `camping-travel-brands`).

---

## 7. Storefront Refactor (`apps/storefront`) — 100% DB-Only
1. **Remove runtime hardcoded data**:
   - Delete `apps/storefront/src/lib/digistyle-data.ts` and remove catalog/brand/review fixture arrays from `src/lib/seed-data.ts` (retain only shared TypeScript types, or move types into `src/lib/types.ts`).
   - Extract static header mega-menu links into `src/components/layout/static-nav.ts` (used only by static `header.tsx`).
2. **Strict Medusa API Data Layer (`src/lib/medusa.ts`)**:
   - Remove `fallbackCatalog`, `fallbackBrands`, and hardcoded review fallbacks (`ds_rev_1`/`ds_rev_2`).
   - Add `getStorefrontPage(slug)` (`GET /store/storefront-pages/:slug?region_id=...`) and `getStorefrontColors()` (`GET /store/storefront-colors`).
   - If backend is unreachable or unconfigured, return `null` / empty arrays and render a clear unavailable/empty UI state instead of static fallback data.
3. **Dynamic Pages & Components**:
   - `src/app/page.tsx`: Loads `getStorefrontPage("home")` and renders all sections dynamically in `rank` order via a `StorefrontSectionRenderer` switch across all 9 widget types.
   - `src/app/landings/[slug]/page.tsx`: Loads `getStorefrontPage(slug)`; renders its dynamic sections (with anchor pills when multiple carousel sections exist) or calls `notFound()` if missing/inactive.
   - `src/components/catalog/product-page-view.tsx` & `product-detail.tsx`: Read `seller_stats`, `promo_badge`, `specifications`, `size_guide`, and `recommended_product_ids` directly from `product.metadata`, reviews from `getReviews(product.id)`, and color hex codes from `getStorefrontColors()` (passed from Server Component / context).
   - `src/app/categories/[handle]/page.tsx` & `src/app/brands/[handle]/page.tsx`: Query Medusa categories/brands directly; return `notFound()` when a handle does not exist in DB (no hardcoded mega-menu title fallback).
4. **Tests**:
   - Update `src/lib/__tests__/storefront.test.ts` and `src/components/catalog/catalog.test.ts` to use minimal inline test fixtures (no dependency on removed runtime seed files) and add tests for `StorefrontSectionRenderer` / color-map resolution.

---

## 8. Docs, Changeset & Verification Plan
1. **Docs & Changeset**:
   - Update `AGENTS.md` and `README.md` in modified packages (`@medusajs/types`, `@medusajs/store`, `@medusajs/core-flows`, `@medusajs/medusa`, `@medusajs/js-sdk`, `@medusajs/dashboard`).
   - Add `.changeset/dynamic-storefront-pages-and-seed.md` (`patch`).
2. **Verification**:
   - Run `yarn migration:create` in `packages/modules/store` and verify migration runs cleanly on Postgres.
   - Run unit tests:
     - `packages/modules/store`
     - `packages/medusa` (`src/api/__tests__/middlewares.spec.ts`)
     - `packages/admin/dashboard` (`utils.spec.ts` for `CORE_POLICY_RESOURCES` + `validate-translations.spec.ts` after `yarn i18n:schema`)
     - `apps/storefront` unit tests
   - Add HTTP integration tests (`integration-tests/http/__tests__/store/admin/storefront-pages.spec.ts` & `store/storefront-pages.spec.ts`) covering CRUD, reordering, hybrid product resolution, `allowed` fields, and RBAC `403` when `ENABLE_RBAC_MODULE="true"`.
   - Build all touched workspace packages (`@medusajs/types`, `@medusajs/store`, `@medusajs/core-flows`, `@medusajs/js-sdk`, `@medusajs/medusa`, `@medusajs/dashboard`) and run `tsc --noEmit` + `next build` in `apps/storefront`.
   - Run `medusa exec ./scripts/seed-fashion.ts` twice to confirm idempotency, then verify live rendering of `/`, `/landings/jackets`, `/product/22797531-...`, and edits from Medusa Admin immediately reflect on the storefront.
