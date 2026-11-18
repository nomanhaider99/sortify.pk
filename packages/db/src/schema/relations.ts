import { relations } from "drizzle-orm";
import {
  adminUsers,
  auditLogs,
  invites,
  passwordResetTokens,
  rolePermissions,
  roles,
} from "./admin";
import {
  categories,
  productCategories,
  productImages,
  productOptions,
  productOptionValues,
  products,
  productVariants,
  reviews,
  variantOptionValues,
} from "./catalog";
import {
  addresses,
  cartItems,
  carts,
  customers,
  orderEvents,
  orderItems,
  orderNotes,
  orders,
  payments,
} from "./commerce";
import { contactMessages } from "./content";

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: "category_parent",
  }),
  children: many(categories, { relationName: "category_parent" }),
  products: many(productCategories),
}));

export const productsRelations = relations(products, ({ many }) => ({
  categories: many(productCategories),
  images: many(productImages),
  options: many(productOptions),
  variants: many(productVariants),
  reviews: many(reviews),
}));

export const productCategoriesRelations = relations(productCategories, ({ one }) => ({
  product: one(products, { fields: [productCategories.productId], references: [products.id] }),
  category: one(categories, {
    fields: [productCategories.categoryId],
    references: [categories.id],
  }),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

export const productOptionsRelations = relations(productOptions, ({ one, many }) => ({
  product: one(products, { fields: [productOptions.productId], references: [products.id] }),
  values: many(productOptionValues),
}));

export const productOptionValuesRelations = relations(productOptionValues, ({ one, many }) => ({
  option: one(productOptions, {
    fields: [productOptionValues.optionId],
    references: [productOptions.id],
  }),
  variants: many(variantOptionValues),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
  image: one(productImages, {
    fields: [productVariants.imageId],
    references: [productImages.id],
  }),
  optionValues: many(variantOptionValues),
}));

export const variantOptionValuesRelations = relations(variantOptionValues, ({ one }) => ({
  variant: one(productVariants, {
    fields: [variantOptionValues.variantId],
    references: [productVariants.id],
  }),
  optionValue: one(productOptionValues, {
    fields: [variantOptionValues.optionValueId],
    references: [productOptionValues.id],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  order: one(orders, { fields: [reviews.orderId], references: [orders.id] }),
  moderator: one(adminUsers, { fields: [reviews.moderatedBy], references: [adminUsers.id] }),
}));

export const customersRelations = relations(customers, ({ many, one }) => ({
  orders: many(orders),
  addresses: many(addresses),
  cart: one(carts),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  events: many(orderEvents),
  notes: many(orderNotes),
  payments: many(payments),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
  order: one(orders, { fields: [addresses.orderId], references: [orders.id] }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  variant: one(productVariants, {
    fields: [orderItems.variantId],
    references: [productVariants.id],
  }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
  author: one(adminUsers, { fields: [orderEvents.createdBy], references: [adminUsers.id] }),
}));

export const orderNotesRelations = relations(orderNotes, ({ one }) => ({
  order: one(orders, { fields: [orderNotes.orderId], references: [orders.id] }),
  author: one(adminUsers, { fields: [orderNotes.authorId], references: [adminUsers.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const cartsRelations = relations(carts, ({ one, many }) => ({
  customer: one(customers, { fields: [carts.customerId], references: [customers.id] }),
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  variant: one(productVariants, {
    fields: [cartItems.variantId],
    references: [productVariants.id],
  }),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  permissions: many(rolePermissions),
  users: many(adminUsers),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  role: one(roles, { fields: [adminUsers.roleId], references: [roles.id] }),
  inviter: one(adminUsers, {
    fields: [adminUsers.invitedBy],
    references: [adminUsers.id],
    relationName: "admin_inviter",
  }),
  invitees: many(adminUsers, { relationName: "admin_inviter" }),
  invites: many(invites),
  passwordResetTokens: many(passwordResetTokens),
  auditLogs: many(auditLogs),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  user: one(adminUsers, { fields: [invites.userId], references: [adminUsers.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(adminUsers, { fields: [passwordResetTokens.userId], references: [adminUsers.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(adminUsers, { fields: [auditLogs.actorId], references: [adminUsers.id] }),
}));

export const contactMessagesRelations = relations(contactMessages, ({ one }) => ({
  handler: one(adminUsers, { fields: [contactMessages.handledBy], references: [adminUsers.id] }),
}));
