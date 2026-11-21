import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261120210410 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_brand" drop constraint if exists "brand_handle_unique";`);
    this.addSql(`create table if not exists "product_brand" ("id" text not null, "name" text not null, "handle" text not null, "logo_url" text null, "banner_url" text null, "description" text null, "is_featured" boolean not null default false, "country" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_brand_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_deleted_at" ON "product_brand" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_brand_handle_unique" ON "product_brand" ("handle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "product_review" ("id" text not null, "customer_id" text null, "customer_name" text not null, "rating" integer not null, "title" text null, "content" text not null, "pros" jsonb null, "cons" jsonb null, "is_recommended" boolean not null default true, "verified_purchase" boolean not null default false, "status" text check ("status" in ('pending', 'approved', 'rejected')) not null default 'approved', "metadata" jsonb null, "product_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "product_review_pkey" primary key ("id"), constraint product_review_rating_check check (rating between 1 and 5));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_product_id" ON "product_review" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_review_deleted_at" ON "product_review" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_customer_id" ON "product_review" ("customer_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_status" ON "product_review" ("status") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_review" add constraint "product_review_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product" add column if not exists "brand_id" text null;`);
    this.addSql(`alter table if exists "product" add constraint "product_brand_id_foreign" foreign key ("brand_id") references "product_brand" ("id") on update cascade on delete set null;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_brand_id" ON "product" ("brand_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" drop constraint if exists "product_brand_id_foreign";`);

    this.addSql(`drop table if exists "product_brand" cascade;`);

    this.addSql(`drop table if exists "product_review" cascade;`);

    this.addSql(`drop index if exists "IDX_product_brand_id";`);
    this.addSql(`alter table if exists "product" drop column if exists "brand_id";`);
  }

}
