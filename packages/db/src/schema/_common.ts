import {
  DELIVERY_METHODS,
  MESSAGE_STATUSES,
  ORDER_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  PRODUCT_STATUSES,
  REVIEW_STATUSES,
} from "@repo/shared";
import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

export const id = () => uuid("id").primaryKey().defaultRandom();

export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const productStatusEnum = pgEnum("product_status", PRODUCT_STATUSES);
export const reviewStatusEnum = pgEnum("review_status", REVIEW_STATUSES);
export const messageStatusEnum = pgEnum("message_status", MESSAGE_STATUSES);
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUSES);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUSES);
export const deliveryMethodEnum = pgEnum("delivery_method", DELIVERY_METHODS);
