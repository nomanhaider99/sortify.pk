import { z } from "zod";
import { ORDER_NUMBER_PATTERN } from "../order-number";

const name = z.string().trim().min(2, "Please enter your name").max(80);
const email = z.email("Please enter a valid email").trim().toLowerCase().max(200);
const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d\s().-]*$/, "Please enter a valid phone number");

/** Honeypot: must stay empty (bots fill every field). */
const honeypot = z.string().max(0).optional();

export const contactFormSchema = z.object({
  name,
  email,
  phone: phone.optional(),
  subject: z.string().trim().min(2).max(140),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
  website: honeypot,
});
export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const reviewFormSchema = z.object({
  productId: z.uuid(),
  name,
  email,
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(10, "Review should be at least 10 characters").max(4000),
  images: z.array(z.url()).max(4).optional(),
  website: honeypot,
});
export type ReviewFormInput = z.infer<typeof reviewFormSchema>;

export const newsletterSchema = z.object({ email, website: honeypot });
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const orderNumberSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(ORDER_NUMBER_PATTERN, "Order numbers look like SF-20260101-AB12");

export const trackLookupSchema = z.object({ orderNumber: orderNumberSchema, email });
export type TrackLookupInput = z.infer<typeof trackLookupSchema>;

export const addressSchema = z.object({
  name,
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().max(100),
  postalCode: z.string().trim().min(2).max(20),
  country: z.string().trim().length(2, "Use a 2-letter country code"),
  phone,
});
export type AddressInput = z.infer<typeof addressSchema>;
