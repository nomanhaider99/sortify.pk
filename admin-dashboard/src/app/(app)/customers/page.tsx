import { listAdminCustomers } from "@repo/db/admin";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { ExportCustomersButton } from "@/components/catalog/export-customers";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { money } from "@/lib/format";
import { LocalTime } from "@/components/ui/local-time";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const session = await requirePagePermission("customers:view");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listAdminCustomers({ q, limit: 50, offset: (page - 1) * 50 });
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <Card className="p-0">
      <div className="border-border flex flex-wrap items-center gap-3 border-b p-4">
        <form role="search" className="flex-1">
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search name, email or phone"
            aria-label="Search customers"
            className="max-w-md"
          />
        </form>
        <span className="text-ink-muted text-sm">{total} customers</span>
        {session.can("data:export") ? <ExportCustomersButton q={q} /> : null}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <THead>
            <TR>
              <TH>Customer</TH>
              <TH>Orders</TH>
              <TH>Spent</TH>
              <TH>Last order</TH>
              <TH>Since</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD>
                  <Link
                    href={`/customers/${c.id}` as Route}
                    className="font-medium hover:underline"
                  >
                    {c.name}
                  </Link>
                  <p className="text-ink-muted text-xs">
                    {c.email}
                    {c.acceptsMarketing ? (
                      <Badge tone="accent" className="ml-2">
                        Subscribed
                      </Badge>
                    ) : null}
                  </p>
                </TD>
                <TD className="tabular-nums">{c.orderCount}</TD>
                <TD className="tabular-nums">{money(c.totalSpent)}</TD>
                <TD className="text-ink-muted text-sm">
                  {c.lastOrderAt ? <LocalTime value={c.lastOrderAt} format="date" /> : "—"}
                </TD>
                <TD className="text-ink-muted text-sm">
                  <LocalTime value={c.createdAt} format="date" />
                </TD>
              </TR>
            ))}
            {!rows.length ? (
              <TR>
                <TD colSpan={5} className="text-ink-muted py-16 text-center">
                  No customers found.
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </div>
      {pages > 1 ? (
        <div className="border-border flex justify-between border-t px-4 py-3 text-sm">
          <span className="text-ink-muted">
            Page {page} of {pages}
          </span>
          <div className="flex gap-3">
            {page > 1 ? (
              <Link href={`/customers?q=${encodeURIComponent(q)}&page=${page - 1}` as Route}>
                Previous
              </Link>
            ) : null}
            {page < pages ? (
              <Link href={`/customers?q=${encodeURIComponent(q)}&page=${page + 1}` as Route}>
                Next
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
