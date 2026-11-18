import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  check,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { adminUsers } from "./admin";
import { orders } from "./commerce";
import { id, productStatusEnum, reviewStatusEnum, timestamps } from "./_common";

export const categories = pgTable(
  "categories",
  {
    id: id(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    imageUrl: text("image_url"),
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    sortOrder: integer("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    showInMenu: boolean("show_in_menu").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("categories_slug_uq").on(t.slug),
    index("categories_parent_idx").on(t.parentId),
    index("categories_sort_idx").on(t.sortOrder),
    index("categories_name_search_idx").on(sql`lower(${t.name})`),
  ],
);

export const products = pgTable(
  "products",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    /** Short marketing summary shown near the price on the product page. */
    summary: text("summary").notNull().default(""),
    brand: text("brand").notNull(),
    tags: text("tags")
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    /** Free-form spec rows for the "Dimensions & Materials" accordion. */
    details: jsonb("details")
      .$type<{ dimensions?: string; materials?: string; care?: string }>()
      .notNull()
      .default({}),
    status: productStatusEnum("status").notNull().default("draft"),
    isFeatured: boolean("is_featured").notNull().default(false),
    basePriceCents: integer("base_price_cents").notNull(),
    compareAtPriceCents: integer("compare_at_price_cents"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    ratingAvg: numeric("rating_avg", { precision: 3, scale: 2, mode: "number" })
      .notNull()
      .default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    /** Units sold, maintained at order creation; drives "best selling" sort. */
    salesCount: integer("sales_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_status_idx").on(t.status, t.deletedAt),
    index("products_featured_idx").on(t.isFeatured),
    index("products_title_search_idx").on(sql`lower(${t.title})`),
    index("products_created_idx").on(t.createdAt),
    check("products_price_nonneg", sql`${t.basePriceCents} >= 0`),
  ],
);

export const productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productId, t.categoryId] }),
    index("product_categories_category_idx").on(t.categoryId),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    width: integer("width"),
    height: integer("height"),
    sortOrder: integer("sort_order").notNull().default(0),
    variantId: uuid("variant_id").references((): AnyPgColumn => productVariants.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("product_images_product_idx").on(t.productId, t.sortOrder),
    index("product_images_variant_idx").on(t.variantId),
  ],
);

export const productOptions = pgTable(
  "product_options",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("product_options_product_idx").on(t.productId),
    uniqueIndex("product_options_product_name_uq").on(t.productId, t.name),
  ],
);

export const productOptionValues = pgTable(
  "product_option_values",
  {
    id: id(),
    optionId: uuid("option_id")
      .notNull()
      .references(() => productOptions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    swatchHex: text("swatch_hex"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    index("product_option_values_option_idx").on(t.optionId),
    uniqueIndex("product_option_values_option_value_uq").on(t.optionId, t.value),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    priceCents: integer("price_cents").notNull(),
    compareAtPriceCents: integer("compare_at_price_cents"),
    stockQty: integer("stock_qty").notNull().default(0),
    imageId: uuid("image_id").references((): AnyPgColumn => productImages.id, {
      onDelete: "set null",
    }),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("product_variants_sku_uq").on(t.sku),
    index("product_variants_product_idx").on(t.productId),
    index("product_variants_image_idx").on(t.imageId),
    check("product_variants_stock_nonneg", sql`${t.stockQty} >= 0`),
    check("product_variants_price_nonneg", sql`${t.priceCents} >= 0`),
  ],
);

export const variantOptionValues = pgTable(
  "variant_option_values",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => productVariants.id, { onDelete: "cascade" }),
    optionValueId: uuid("option_value_id")
      .notNull()
      .references(() => productOptionValues.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.variantId, t.optionValueId] }),
    index("variant_option_values_value_idx").on(t.optionValueId),
  ],
);

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    orderId: uuid("order_id").references((): AnyPgColumn => orders.id, { onDelete: "set null" }),
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    rating: smallint("rating").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    images: jsonb("images").$type<string[]>().notNull().default([]),
    status: reviewStatusEnum("status").notNull().default("pending"),
    isFeatured: boolean("is_featured").notNull().default(false),
    isVerifiedPurchase: boolean("is_verified_purchase").notNull().default(false),
    ownerReply: text("owner_reply"),
    moderatedBy: uuid("moderated_by").references(() => adminUsers.id, { onDelete: "set null" }),
    moderatedAt: timestamp("moderated_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("reviews_product_status_idx").on(t.productId, t.status),
    index("reviews_status_idx").on(t.status, t.createdAt),
    index("reviews_featured_idx").on(t.isFeatured),
    index("reviews_order_idx").on(t.orderId),
    index("reviews_moderated_by_idx").on(t.moderatedBy),
    index("reviews_email_idx").on(sql`lower(${t.customerEmail})`),
    check("reviews_rating_range", sql`${t.rating} between 1 and 5`),
  ],
);
