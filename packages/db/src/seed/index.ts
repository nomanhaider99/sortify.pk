/**
 * `pnpm db:seed`
 *
 * Development (default): wipes all data and loads the full demo dataset — roles, the Owner
 * (from ADMIN_EMAIL / ADMIN_PASSWORD), one demo user per default role, categories, ~35 home decor &
 * kitchen products with variants, reviews, sample orders with tracking events, messages and settings.
 *
 * Production (NODE_ENV=production): never wipes. Only upserts system roles/permissions, default
 * settings, and creates the Owner if no Owner exists yet.
 */
import {
  BRAND,
  DEFAULT_ROLES,
  DEFAULT_SETTINGS,
  ORDER_FLOW,
  ORDER_STATUS_LABELS,
  OWNER_ROLE,
  SYSTEM_ROLE_NAMES,
  generateOrderNumber,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@repo/shared";
import { eq, sql } from "drizzle-orm";
import { createClient, type Transaction } from "../client";
import { hashPassword, passwordPolicyErrors } from "../password";
import * as t from "../schema";
import { PRODUCT_IMAGES, SITE_IMAGES, CATEGORY_IMAGES } from "../../scripts/image-manifest";
import {
  CATEGORIES,
  PENDING_REVIEWS,
  PRODUCTS,
  REVIEW_SNIPPETS,
  imageUrl,
  slugify,
  type SeedOptionValue,
  type SeedProduct,
} from "./data";

const PRODUCT_AND_SITE_IMAGES = [...PRODUCT_IMAGES, ...SITE_IMAGES, ...CATEGORY_IMAGES];

const isProd = process.env.NODE_ENV === "production";
const DEMO_PASSWORD = "DemoPass!123";
const DAY = 86_400_000;
const now = Date.now();
const daysAgo = (n: number, hours = 0) => new Date(now - n * DAY - hours * 3_600_000);

/** Deterministic PRNG so every seed run produces the same dataset. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const rand = rng(42);

const { db, sql: client } = createClient(undefined, { max: 1 });

async function wipe(tx: Transaction) {
  const tables = [
    "audit_logs",
    "login_attempts",
    "invites",
    "password_reset_tokens",
    "cart_items",
    "carts",
    "payments",
    "order_notes",
    "order_events",
    "order_items",
    "addresses",
    "reviews",
    "orders",
    "customers",
    "variant_option_values",
    "product_variants",
    "product_option_values",
    "product_options",
    "product_images",
    "product_categories",
    "products",
    "categories",
    "contact_messages",
    "newsletter_subscribers",
    "settings",
    "admin_users",
    "role_permissions",
    "roles",
  ];
  await tx.execute(sql.raw(`TRUNCATE ${tables.map((n) => `"${n}"`).join(", ")} CASCADE`));
}

async function seedRoles(tx: Transaction) {
  const ids = new Map<string, string>();
  for (const name of SYSTEM_ROLE_NAMES) {
    const def = DEFAULT_ROLES[name];
    const [found] = await tx
      .select({ id: t.roles.id })
      .from(t.roles)
      .where(sql`lower(${t.roles.name}) = ${name.toLowerCase()}`)
      .limit(1);
    const [role] = found
      ? await tx
          .update(t.roles)
          .set({ isSystem: true })
          .where(eq(t.roles.id, found.id))
          .returning({ id: t.roles.id })
      : await tx
          .insert(t.roles)
          .values({ name, description: def.description, isSystem: true })
          .returning({ id: t.roles.id });
    if (!role) throw new Error(`Failed to upsert role ${name}`);
    ids.set(name, role.id);
    // Owner always gets every permission; other system roles are only filled when new (editable).
    const existing = await tx
      .select({ p: t.rolePermissions.permission })
      .from(t.rolePermissions)
      .where(eq(t.rolePermissions.roleId, role.id));
    if (name === OWNER_ROLE || existing.length === 0) {
      await tx
        .insert(t.rolePermissions)
        .values(def.permissions.map((permission) => ({ roleId: role.id, permission })))
        .onConflictDoNothing();
    }
  }
  return ids;
}

async function seedSettings(tx: Transaction, overwrite: boolean) {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const q = tx.insert(t.settings).values({ key, value });
    await (overwrite
      ? q.onConflictDoUpdate({ target: t.settings.key, set: { value } })
      : q.onConflictDoNothing());
  }
}

async function seedOwner(tx: Transaction, roleIds: Map<string, string>) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password)
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the Owner.");
  const policy = passwordPolicyErrors(password);
  if (policy.length) throw new Error(`ADMIN_PASSWORD must contain ${policy.join(", ")}.`);

  const ownerRoleId = roleIds.get(OWNER_ROLE);
  if (!ownerRoleId) throw new Error("Owner role missing");
  const existingOwner = await tx
    .select({ id: t.adminUsers.id })
    .from(t.adminUsers)
    .where(eq(t.adminUsers.roleId, ownerRoleId))
    .limit(1);
  if (existingOwner[0]) return existingOwner[0].id;

  const [owner] = await tx
    .insert(t.adminUsers)
    .values({
      email,
      name: "Store Owner",
      passwordHash: await hashPassword(password),
      roleId: ownerRoleId,
      mustChangePassword: true,
    })
    .returning({ id: t.adminUsers.id });
  if (!owner) throw new Error("Failed to create Owner");
  return owner.id;
}

async function seedDemoUsers(tx: Transaction, roleIds: Map<string, string>, ownerId: string) {
  const hash = await hashPassword(DEMO_PASSWORD);
  const users = SYSTEM_ROLE_NAMES.filter((r) => r !== OWNER_ROLE).map((role) => ({
    email: `${role.toLowerCase()}@example.com`,
    name: `Demo ${role}`,
    passwordHash: hash,
    roleId: roleIds.get(role) ?? "",
    invitedBy: ownerId,
    lastLoginAt: daysAgo(Math.floor(rand() * 10)),
  }));
  await tx.insert(t.adminUsers).values(users);
  return users.map((u) => u.email);
}

type VariantRow = {
  id: string;
  productId: string;
  title: string;
  sku: string;
  priceCents: number;
  label: string;
  image: string;
  stockQty: number;
};

async function seedCatalog(tx: Transaction) {
  const categoryIds = new Map<string, string>();
  for (const [i, c] of CATEGORIES.entries()) {
    const [row] = await tx
      .insert(t.categories)
      .values({
        slug: c.slug,
        name: c.name,
        description: c.description,
        imageUrl: imageUrl(c.image),
        sortOrder: i,
      })
      .returning({ id: t.categories.id });
    if (row) categoryIds.set(c.slug, row.id);
  }

  const alts = new Map(PRODUCT_AND_SITE_IMAGES.map((i) => [i.name, i.alt]));
  const variants: VariantRow[] = [];
  const productIds = new Map<string, string>();

  for (const p of PRODUCTS) {
    const created = daysAgo(p.ageDays);
    const [product] = await tx
      .insert(t.products)
      .values({
        slug: p.slug,
        title: p.title,
        summary: p.summary,
        description: p.description,
        brand: BRAND.name,
        tags: p.tags,
        details: { dimensions: p.dimensions, materials: p.materials, care: p.care },
        status: "active",
        isFeatured: p.featured ?? false,
        basePriceCents: p.priceCents,
        compareAtPriceCents: p.compareAtCents ?? null,
        seoTitle: `${p.title} | ${BRAND.name}`,
        seoDescription: p.summary,
        salesCount: p.salesCount,
        publishedAt: created,
        createdAt: created,
      })
      .returning({ id: t.products.id });
    if (!product) throw new Error(`Failed to insert ${p.slug}`);
    productIds.set(p.slug, product.id);

    await tx.insert(t.productCategories).values({
      productId: product.id,
      categoryId: categoryIds.get(p.category) ?? "",
    });

    await tx.insert(t.productImages).values(
      p.images.map((name, i) => ({
        productId: product.id,
        url: imageUrl(name),
        alt: i === 0 ? p.title : (alts.get(name) ?? p.title),
        sortOrder: i,
      })),
    );

    await seedVariants(tx, p, product.id, variants);
  }
  return { categoryIds, productIds, variants };
}

/** Creates option groups and the cartesian product of their values as variants. */
async function seedVariants(tx: Transaction, p: SeedProduct, productId: string, out: VariantRow[]) {
  const valueIds = new Map<string, string>(); // "Option:Value" -> id
  for (const [oi, option] of (p.options ?? []).entries()) {
    const [opt] = await tx
      .insert(t.productOptions)
      .values({ productId, name: option.name, sortOrder: oi })
      .returning({ id: t.productOptions.id });
    for (const [vi, v] of option.values.entries()) {
      const [row] = await tx
        .insert(t.productOptionValues)
        .values({
          optionId: opt?.id ?? "",
          value: v.value,
          swatchHex: v.swatchHex ?? null,
          sortOrder: vi,
        })
        .returning({ id: t.productOptionValues.id });
      if (row) valueIds.set(`${option.name}:${v.value}`, row.id);
    }
  }

  // Cartesian product of option values (one empty combination when there are no options).
  let combos: { option: string; value: SeedOptionValue }[][] = [[]];
  for (const option of p.options ?? []) {
    combos = combos.flatMap((c) =>
      option.values.map((value) => [...c, { option: option.name, value }]),
    );
  }

  const base = p.slug
    .split("-")
    .map((w) => w.slice(0, 3).toUpperCase())
    .slice(0, 2)
    .join("");

  for (const [sort, combo] of combos.entries()) {
    const key = combo.map((c) => c.value.value).join("/") || "default";
    const stock =
      p.stock?.[key] ??
      combo.map((c) => p.stock?.[c.value.value]).find((s) => s !== undefined) ??
      8 + Math.floor(rand() * 25);
    const surcharge = combo.reduce((s, c) => s + (c.value.surchargeCents ?? 0), 0);
    const sku = [base, ...combo.map((c) => slugify(c.value.value).replace(/-/g, "").slice(0, 4))]
      .join("-")
      .toUpperCase();
    const [variant] = await tx
      .insert(t.productVariants)
      .values({
        productId,
        sku,
        priceCents: p.priceCents + surcharge,
        compareAtPriceCents: p.compareAtCents ? p.compareAtCents + surcharge : null,
        stockQty: stock,
        sortOrder: sort,
      })
      .returning({ id: t.productVariants.id });
    if (!variant) throw new Error(`Failed to insert variant ${sku}`);

    const links = combo
      .map((c) => valueIds.get(`${c.option}:${c.value.value}`))
      .filter((v): v is string => Boolean(v));
    if (links.length) {
      await tx
        .insert(t.variantOptionValues)
        .values(links.map((optionValueId) => ({ variantId: variant.id, optionValueId })));
    }

    out.push({
      id: variant.id,
      productId,
      title: p.title,
      sku,
      priceCents: p.priceCents + surcharge,
      label: combo.map((c) => `${c.option}: ${c.value.value}`).join(" · "),
      image: imageUrl(p.images[0] ?? ""),
      stockQty: stock,
    });
  }
}

const CUSTOMERS = [
  {
    name: "Amelia Reyes",
    email: "amelia@example.com",
    city: "Portland",
    state: "OR",
    postal: "97205",
  },
  {
    name: "Daniel Kim",
    email: "daniel@example.com",
    city: "Seattle",
    state: "WA",
    postal: "98101",
  },
  { name: "Priya Shah", email: "priya@example.com", city: "Austin", state: "TX", postal: "78701" },
  { name: "Marcus Lee", email: "marcus@example.com", city: "Denver", state: "CO", postal: "80202" },
  {
    name: "Hannah Wright",
    email: "hannah@example.com",
    city: "Chicago",
    state: "IL",
    postal: "60601",
  },
  {
    name: "Oliver Turner",
    email: "oliver@example.com",
    city: "Boston",
    state: "MA",
    postal: "02108",
  },
];

type SampleOrder = {
  customer: number;
  status: OrderStatus;
  payment: PaymentMethod;
  paymentStatus: PaymentStatus;
  ageDays: number;
  items: number[];
  qty?: number[];
  express?: boolean;
};

const SAMPLE_ORDERS: SampleOrder[] = [
  {
    customer: 0,
    status: "pending",
    payment: "cod",
    paymentStatus: "pending",
    ageDays: 0,
    items: [0, 30],
  },
  {
    customer: 1,
    status: "pending",
    payment: "card_demo",
    paymentStatus: "paid",
    ageDays: 0,
    items: [12],
  },
  {
    customer: 2,
    status: "confirmed",
    payment: "card_demo",
    paymentStatus: "paid",
    ageDays: 1,
    items: [4, 22],
  },
  {
    customer: 3,
    status: "processing",
    payment: "cod",
    paymentStatus: "pending",
    ageDays: 2,
    items: [40],
    qty: [4],
  },
  {
    customer: 4,
    status: "shipped",
    payment: "card_demo",
    paymentStatus: "paid",
    ageDays: 4,
    items: [18],
    express: true,
  },
  {
    customer: 5,
    status: "out_for_delivery",
    payment: "cod",
    paymentStatus: "pending",
    ageDays: 6,
    items: [8, 26],
  },
  {
    customer: 0,
    status: "delivered",
    payment: "cod",
    paymentStatus: "paid",
    ageDays: 14,
    items: [2],
  },
  {
    customer: 1,
    status: "delivered",
    payment: "card_demo",
    paymentStatus: "paid",
    ageDays: 25,
    items: [34, 36],
  },
  {
    customer: 2,
    status: "cancelled",
    payment: "card_demo",
    paymentStatus: "refunded",
    ageDays: 9,
    items: [14],
  },
  {
    customer: 3,
    status: "refunded",
    payment: "card_demo",
    paymentStatus: "refunded",
    ageDays: 30,
    items: [20],
  },
];

const EVENT_COPY: Partial<Record<OrderStatus, string>> = {
  pending: "We've received your order and will confirm it shortly.",
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your items are being carefully packed at our workshop.",
  shipped: "Your parcel has left our warehouse.",
  out_for_delivery: "Your parcel is out for delivery today.",
  delivered: "Your parcel was delivered. Enjoy!",
  cancelled: "This order was cancelled.",
  refunded: "Your refund has been processed.",
};

async function seedCustomersAndOrders(tx: Transaction, variants: VariantRow[], staffId: string) {
  const customerIds: string[] = [];
  for (const c of CUSTOMERS) {
    const [row] = await tx
      .insert(t.customers)
      .values({ email: c.email, name: c.name, phone: "+1 555 010 0000", createdAt: daysAgo(40) })
      .returning({ id: t.customers.id });
    if (row) customerIds.push(row.id);
  }

  const delivered: { email: string; orderId: string; productId: string }[] = [];

  for (const o of SAMPLE_ORDERS) {
    const c = CUSTOMERS[o.customer];
    const customerId = customerIds[o.customer];
    if (!c || !customerId) continue;
    const placed = daysAgo(o.ageDays, 2 + Math.floor(rand() * 6));
    const lines = o.items.map((idx, i) => {
      const v = variants[idx % variants.length];
      if (!v) throw new Error("variant index out of range");
      const quantity = o.qty?.[i] ?? 1;
      return { v, quantity, total: v.priceCents * quantity };
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    const shipping = o.express
      ? DEFAULT_SETTINGS.shipping.expressCents
      : subtotal >= DEFAULT_SETTINGS.shipping.freeShippingThresholdCents
        ? 0
        : DEFAULT_SETTINGS.shipping.standardCents;
    const total = subtotal + shipping;
    const address = {
      name: c.name,
      line1: `${100 + Math.floor(rand() * 800)} Market Street`,
      city: c.city,
      state: c.state,
      postalCode: c.postal,
      country: "US",
      phone: "+1 555 010 0000",
    };

    const reached = (s: OrderStatus) => {
      const flowIdx = ORDER_FLOW.indexOf(o.status);
      return flowIdx >= 0 && ORDER_FLOW.indexOf(s) <= flowIdx;
    };
    const stepTime = (step: number) => new Date(placed.getTime() + step * 0.8 * DAY);
    const shippedish = reached("shipped") || o.status === "refunded";

    const [order] = await tx
      .insert(t.orders)
      .values({
        orderNumber: generateOrderNumber(placed, "MJ", rand),
        customerId,
        email: c.email,
        phone: address.phone,
        status: o.status,
        paymentMethod: o.payment,
        paymentStatus: o.paymentStatus,
        subtotalCents: subtotal,
        shippingCents: shipping,
        totalCents: total,
        currency: "USD",
        shippingAddress: address,
        deliveryMethod: o.express ? "express" : "standard",
        carrier: shippedish ? "UPS" : null,
        trackingNumber: shippedish
          ? `1Z${Math.floor(rand() * 1e10)
              .toString()
              .padStart(10, "0")}`
          : null,
        trackingUrl: shippedish ? "https://www.ups.com/track" : null,
        estimatedDelivery: shippedish ? stepTime(5).toISOString().slice(0, 10) : null,
        placedAt: placed,
        confirmedAt: reached("confirmed") || o.status === "refunded" ? stepTime(1) : null,
        shippedAt: shippedish ? stepTime(3) : null,
        deliveredAt: reached("delivered") || o.status === "refunded" ? stepTime(5) : null,
        cancelledAt: o.status === "cancelled" ? stepTime(1) : null,
        refundedAt: o.status === "refunded" ? stepTime(8) : null,
        createdAt: placed,
      })
      .returning({ id: t.orders.id });
    if (!order) throw new Error("Failed to insert order");

    await tx.insert(t.addresses).values({ orderId: order.id, ...address });
    await tx.insert(t.orderItems).values(
      lines.map((l) => {
        return {
          orderId: order.id,
          productId: l.v.productId,
          variantId: l.v.id,
          titleSnapshot: l.v.title,
          variantSnapshot: l.v.label,
          imageSnapshot: l.v.image,
          sku: l.v.sku,
          unitPriceCents: l.v.priceCents,
          quantity: l.quantity,
          totalCents: l.total,
        };
      }),
    );

    // Tracking timeline
    const steps: OrderStatus[] =
      o.status === "cancelled"
        ? ["pending", "cancelled"]
        : o.status === "refunded"
          ? ["pending", "confirmed", "processing", "shipped", "delivered", "refunded"]
          : ORDER_FLOW.slice(0, ORDER_FLOW.indexOf(o.status) + 1);
    const stepIndex: Partial<Record<OrderStatus, number>> = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      out_for_delivery: 4.5,
      delivered: 5,
      cancelled: 1,
      refunded: 8,
    };
    await tx.insert(t.orderEvents).values(
      steps.map((s) => ({
        orderId: order.id,
        status: s,
        title: ORDER_STATUS_LABELS[s],
        description: EVENT_COPY[s] ?? "",
        location: s === "shipped" ? "Portland, OR" : s === "out_for_delivery" ? c.city : null,
        createdBy: s === "pending" ? null : staffId,
        occurredAt: stepTime(stepIndex[s] ?? 0),
        createdAt: stepTime(stepIndex[s] ?? 0),
      })),
    );

    await tx.insert(t.payments).values({
      orderId: order.id,
      provider: o.payment,
      status: o.paymentStatus,
      amountCents: total,
      cardBrand: o.payment === "card_demo" ? "visa" : null,
      cardLast4: o.payment === "card_demo" ? "4242" : null,
      providerRef: o.payment === "card_demo" ? `demo_${Math.floor(rand() * 1e8)}` : null,
      createdAt: placed,
    });

    if (o.status === "processing") {
      await tx.insert(t.orderNotes).values({
        orderId: order.id,
        authorId: staffId,
        body: "Customer asked for delivery after 5pm — noted on the packing slip.",
      });
    }

    if (o.status === "delivered") {
      for (const l of lines)
        delivered.push({ email: c.email, orderId: order.id, productId: l.v.productId });
    }
  }
  return delivered;
}

async function seedReviews(
  tx: Transaction,
  productIds: Map<string, string>,
  delivered: { email: string; orderId: string; productId: string }[],
  moderatorId: string,
) {
  let featured = 0;
  for (const [pi, p] of PRODUCTS.entries()) {
    const productId = productIds.get(p.slug);
    if (!productId) continue;
    const count = 1 + ((pi * 7) % 4);
    for (let i = 0; i < count; i++) {
      const r = REVIEW_SNIPPETS[(pi + i) % REVIEW_SNIPPETS.length];
      if (!r) continue;
      const email = `${slugify(r.name)}@example.com`;
      const verified = delivered.find((d) => d.productId === productId);
      const isFeatured = r.rating === 5 && featured < 6 && i === 0;
      if (isFeatured) featured++;
      await tx.insert(t.reviews).values({
        productId,
        orderId: verified && i === 0 ? verified.orderId : null,
        customerName: r.name,
        customerEmail: verified && i === 0 ? verified.email : email,
        rating: r.rating,
        title: r.title,
        body: r.body,
        status: "approved",
        isFeatured,
        isVerifiedPurchase: Boolean(verified && i === 0),
        ownerReply:
          r.rating <= 3
            ? "Thank you for the honest feedback — the foam does soften over the first few weeks."
            : null,
        moderatedBy: moderatorId,
        moderatedAt: daysAgo(p.ageDays / 2),
        createdAt: daysAgo(Math.max(1, p.ageDays / 2 - i)),
      });
    }
  }
  // A few pending + one rejected review for the moderation queue.
  const queue = [PRODUCTS[0], PRODUCTS[6], PRODUCTS[12]];
  for (const [i, p] of queue.entries()) {
    const productId = p && productIds.get(p.slug);
    const r = PENDING_REVIEWS[i % PENDING_REVIEWS.length];
    if (!productId || !r) continue;
    await tx.insert(t.reviews).values({
      productId,
      customerName: r.name,
      customerEmail: `${slugify(r.name)}@example.com`,
      rating: r.rating,
      title: r.title,
      body: r.body,
      status: "pending",
      createdAt: daysAgo(i),
    });
  }
  const spam = PRODUCTS[3] && productIds.get(PRODUCTS[3].slug);
  if (spam) {
    await tx.insert(t.reviews).values({
      productId: spam,
      customerName: "Promo Bot",
      customerEmail: "bot@spam.example",
      rating: 1,
      title: "Cheap deals here",
      body: "Visit my website for cheap furniture deals!!!",
      status: "rejected",
      moderatedBy: moderatorId,
      moderatedAt: daysAgo(2),
      createdAt: daysAgo(3),
    });
  }

  // Recalculate rating aggregates from approved reviews only.
  await tx.execute(sql`
    update products p set
      rating_avg = coalesce(r.avg, 0),
      rating_count = coalesce(r.cnt, 0)
    from (
      select product_id, round(avg(rating)::numeric, 2) as avg, count(*)::int as cnt
      from reviews where status = 'approved' group by product_id
    ) r
    where r.product_id = p.id
  `);
}

async function seedInbox(tx: Transaction) {
  await tx.insert(t.contactMessages).values([
    {
      name: "Grace Hall",
      email: "grace@example.com",
      subject: "Fabric samples",
      message:
        "Hi! Could you send fabric swatches for the Alba sofa? I'm deciding between Oat and Sage.",
      status: "unread",
      createdAt: daysAgo(0, 3),
    },
    {
      name: "Leo Martin",
      email: "leo@example.com",
      phone: "+1 555 010 4433",
      subject: "Delivery to an apartment",
      message:
        "Do your couriers carry items up stairs? I'm on the third floor without an elevator.",
      status: "read",
      createdAt: daysAgo(2),
    },
    {
      name: "Ava Collins",
      email: "ava@example.com",
      subject: "Trade discount",
      message: "I'm an interior designer — do you offer trade pricing for repeat orders?",
      status: "archived",
      createdAt: daysAgo(12),
    },
  ]);
  await tx
    .insert(t.newsletterSubscribers)
    .values([{ email: "amelia@example.com" }, { email: "marcus@example.com", source: "checkout" }]);
}

async function main() {
  if (isProd) {
    await db.transaction(async (tx) => {
      const roleIds = await seedRoles(tx);
      await seedSettings(tx, false);
      await seedOwner(tx, roleIds);
    });
    console.log(
      "✓ Production seed: system roles, default settings and Owner ensured (no data wiped).",
    );
    return;
  }

  await db.transaction(async (tx) => {
    await wipe(tx);
    const roleIds = await seedRoles(tx);
    await seedSettings(tx, true);
    const ownerId = await seedOwner(tx, roleIds);
    const demo = await seedDemoUsers(tx, roleIds, ownerId);
    const { variants, productIds } = await seedCatalog(tx);
    const delivered = await seedCustomersAndOrders(tx, variants, ownerId);
    await seedReviews(tx, productIds, delivered, ownerId);
    await seedInbox(tx);

    console.log("✓ Seeded development data");
    console.log(`  Owner:  ${process.env.ADMIN_EMAIL ?? ""} (must change password on first login)`);
    console.log(`  Demo users (password ${DEMO_PASSWORD}): ${demo.join(", ")}`);
    console.log(
      `  ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${variants.length} variants, ${SAMPLE_ORDERS.length} orders`,
    );
  });
}

try {
  await main();
} finally {
  await client.end();
}
