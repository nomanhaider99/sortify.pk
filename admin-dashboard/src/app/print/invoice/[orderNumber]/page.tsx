import { getSettings } from "@repo/db";
import { getAdminOrderDetail } from "@repo/db/admin";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/orders/print-button";
import { fmtDate, money } from "@/lib/format";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Invoice" };

/** Printable invoice; `?slip=1` renders a packing slip (no prices). */
export default async function InvoicePage({
  params,
  searchParams,
}: PageProps<"/print/invoice/[orderNumber]">) {
  await requirePagePermission("orders:view");
  const { orderNumber } = await params;
  const slip = (await searchParams).slip === "1";
  const [order, { store }] = await Promise.all([
    getAdminOrderDetail(orderNumber),
    getSettings(["store"]),
  ]);
  if (!order) notFound();
  const a = order.shippingAddress;

  return (
    <main className="mx-auto min-h-svh max-w-3xl bg-white p-10 text-[#1f2a1c] print:p-0">
      <div className="mb-8 flex items-center justify-between gap-4 print:hidden">
        <div className="flex gap-3 text-sm">
          <a
            href={`/print/invoice/${order.orderNumber}`}
            className={slip ? "underline" : "font-semibold"}
          >
            Invoice
          </a>
          <a
            href={`/print/invoice/${order.orderNumber}?slip=1`}
            className={slip ? "font-semibold" : "underline"}
          >
            Packing slip
          </a>
        </div>
        <PrintButton />
      </div>
      <header className="flex items-start justify-between border-b border-[#d9ddd2] pb-6">
        <div>
          <p className="text-2xl font-semibold">{store.name}</p>
          <p className="mt-1 text-sm whitespace-pre-line text-[#5b6656]">{store.address}</p>
          <p className="text-sm text-[#5b6656]">
            {store.email} · {store.phone}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold">{slip ? "Packing slip" : "Invoice"}</p>
          <p className="text-sm">{order.orderNumber}</p>
          <p className="text-sm text-[#5b6656]">{fmtDate(order.placedAt)}</p>
        </div>
      </header>
      <section className="grid grid-cols-2 gap-6 py-6 text-sm">
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-[#5b6656] uppercase">
            Ship to
          </p>
          <p className="font-medium">{a.name}</p>
          <p>
            {a.line1}
            {a.line2 ? `, ${a.line2}` : ""}
          </p>
          <p>
            {a.city}
            {a.state ? `, ${a.state}` : ""} {a.postalCode}
          </p>
          <p>{a.country}</p>
          <p>{a.phone}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-semibold tracking-wide text-[#5b6656] uppercase">
            Details
          </p>
          <p>{order.email}</p>
          <p>
            Payment: {order.paymentMethod === "cod" ? "Cash on delivery" : "Card"} (
            {order.paymentStatus})
          </p>
          <p>Delivery: {order.deliveryMethod}</p>
          {order.trackingNumber ? (
            <p>
              Tracking: {order.carrier} {order.trackingNumber}
            </p>
          ) : null}
        </div>
      </section>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-y border-[#d9ddd2] text-left text-xs text-[#5b6656] uppercase">
            <th className="py-2 font-semibold">Item</th>
            <th className="py-2 font-semibold">SKU</th>
            <th className="py-2 text-right font-semibold">Qty</th>
            {!slip ? (
              <>
                <th className="py-2 text-right font-semibold">Price</th>
                <th className="py-2 text-right font-semibold">Total</th>
              </>
            ) : (
              <th className="py-2 text-right font-semibold">Packed</th>
            )}
          </tr>
        </thead>
        <tbody>
          {order.items.map((it) => (
            <tr key={it.id} className="border-b border-[#eceee8]">
              <td className="py-2.5">
                {it.titleSnapshot}
                {it.variantSnapshot ? (
                  <span className="block text-xs text-[#5b6656]">{it.variantSnapshot}</span>
                ) : null}
              </td>
              <td className="py-2.5">{it.sku}</td>
              <td className="py-2.5 text-right">{it.quantity}</td>
              {!slip ? (
                <>
                  <td className="py-2.5 text-right">{money(it.unitPriceCents)}</td>
                  <td className="py-2.5 text-right">{money(it.totalCents)}</td>
                </>
              ) : (
                <td className="py-2.5 text-right" aria-label="Packed checkbox">
                  ☐
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!slip ? (
        <dl className="mt-4 ml-auto w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{money(order.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{order.shippingCents ? money(order.shippingCents) : "Free"}</dd>
          </div>
          {order.feeCents ? (
            <div className="flex justify-between">
              <dt>COD fee</dt>
              <dd>{money(order.feeCents)}</dd>
            </div>
          ) : null}
          {order.taxCents ? (
            <div className="flex justify-between">
              <dt>Tax</dt>
              <dd>{money(order.taxCents)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-[#d9ddd2] pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{money(order.totalCents)}</dd>
          </div>
        </dl>
      ) : null}
      {order.note ? <p className="mt-8 text-sm">Customer note: {order.note}</p> : null}
      <p className="mt-12 text-center text-xs text-[#5b6656]">
        Thank you for shopping with {store.name}.
      </p>
    </main>
  );
}
