import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261122085643 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_tag" drop constraint if exists "tag_handle_unique";`);
    this.addSql(`alter table if exists "product_product_option" drop constraint if exists "product_product_option_product_id_foreign";`);
    this.addSql(`alter table if exists "product_product_option" drop constraint if exists "product_product_option_product_option_id_foreign";`);

    this.addSql(`alter table if exists "product_product_option_value" drop constraint if exists "product_product_option_value_product_option_value_id_foreign";`);
    this.addSql(`alter table if exists "product_product_option_value" drop constraint if exists "product_product_option_value_product_product_option_id_foreign";`);

    this.addSql(`alter table if exists "product_variant_product_image" drop constraint if exists "product_variant_product_image_image_id_foreign";`);

    this.addSql(`alter table if exists "product_category" add column if not exists "thumbnail" text null, add column if not exists "display_type" text check ("display_type" in ('default', 'products', 'subcategories', 'both')) not null default 'default';`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_product_category_deleted_at" ON "product_category" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_tag" add column if not exists "handle" text null, add column if not exists "description" text not null default '';`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tag_handle_unique" ON "product_tag" ("handle") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "product_review" drop constraint if exists product_review_rating_check;`);

    this.addSql(`alter table if exists "product_review" add constraint product_review_rating_check check(rating between 1 and 5);`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_product_category_deleted_at";`);
    this.addSql(`alter table if exists "product_category" drop column if exists "thumbnail", drop column if exists "display_type";`);

    this.addSql(`alter table if exists "product_product_option" add constraint "product_product_option_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_product_option" add constraint "product_product_option_product_option_id_foreign" foreign key ("product_option_id") references "product_option" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_product_option_value" add constraint "product_product_option_value_product_option_value_id_foreign" foreign key ("product_option_value_id") references "product_option_value" ("id") on update cascade on delete cascade;`);
    this.addSql(`alter table if exists "product_product_option_value" add constraint "product_product_option_value_product_product_option_id_foreign" foreign key ("product_product_option_id") references "product_product_option" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "product_review" drop constraint if exists product_review_rating_check;`);

    this.addSql(`alter table if exists "product_review" add constraint product_review_rating_check check((rating >= 1) AND (rating <= 5));`);

    this.addSql(`drop index if exists "IDX_tag_handle_unique";`);
    this.addSql(`alter table if exists "product_tag" drop column if exists "handle", drop column if exists "description";`);

    this.addSql(`alter table if exists "product_variant_product_image" add constraint "product_variant_product_image_image_id_foreign" foreign key ("image_id") references "image" ("id") on update no action on delete cascade;`);
  }

}
