import type { Route } from "next";
import { redirect } from "next/navigation";

/** Deep link (command palette, notifications) → the inbox with the order selected. */
export default async function OrderDeepLink({ params }: PageProps<"/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  redirect(`/orders?selected=${encodeURIComponent(orderNumber)}` as Route);
}
