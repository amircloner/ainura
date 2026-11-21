import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261121070643 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "storefront_page" drop constraint if exists "storefront_page_slug_unique";`);
    this.addSql(`alter table if exists "storefront_color" drop constraint if exists "storefront_color_name_unique";`);
    this.addSql(`create table if not exists "storefront_color" ("id" text not null, "name" text not null, "hex_code" text not null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_color_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_color_deleted_at" ON "storefront_color" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_color_name_unique" ON "storefront_color" ("name") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "storefront_page" ("id" text not null, "slug" text not null, "title" text not null, "subtitle" text null, "page_type" text check ("page_type" in ('home', 'landing')) not null default 'landing', "is_active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_page_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_page_deleted_at" ON "storefront_page" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_storefront_page_slug_unique" ON "storefront_page" ("slug") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "storefront_section" ("id" text not null, "page_id" text not null, "type" text check ("type" in ('hero_banner', 'category_row', 'brand_marquee', 'amazing_carousel', 'tab_carousel', 'simple_carousel', 'two_banner', 'four_banner', 'trust_badges')) not null, "title" text null, "href" text null, "rank" integer not null default 0, "is_active" boolean not null default true, "config" jsonb not null default '{}', "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "storefront_section_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_section_page_id" ON "storefront_section" ("page_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_section_deleted_at" ON "storefront_section" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_storefront_section_page_rank" ON "storefront_section" ("page_id", "rank") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "storefront_section" add constraint "storefront_section_page_id_foreign" foreign key ("page_id") references "storefront_page" ("id") on update cascade on delete cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "storefront_section" drop constraint if exists "storefront_section_page_id_foreign";`);

    this.addSql(`drop table if exists "storefront_color" cascade;`);

    this.addSql(`drop table if exists "storefront_page" cascade;`);

    this.addSql(`drop table if exists "storefront_section" cascade;`);
  }

}
