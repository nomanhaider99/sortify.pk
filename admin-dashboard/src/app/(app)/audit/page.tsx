import { listAuditLogs } from "@repo/db/admin";
import type { Metadata, Route } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { requirePagePermission } from "@/lib/session";

export const metadata: Metadata = { title: "Audit log" };

const PAGE = 50;
const ENTITY_TYPES = [
  "order",
  "product",
  "category",
  "review",
  "customer",
  "message",
  "admin_user",
  "role",
  "settings",
];
const dateFmt = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "medium" });

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  await requirePagePermission("audit:view");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 80) : "";
  const type = typeof sp.type === "string" && ENTITY_TYPES.includes(sp.type) ? sp.type : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listAuditLogs({
    q: q || undefined,
    entityType: type || undefined,
    limit: PAGE,
    offset: (page - 1) * PAGE,
  });
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) =>
    `/audit?${new URLSearchParams({ ...(q ? { q } : {}), ...(type ? { type } : {}), page: String(p) }).toString()}` as Route;

  return (
    <Card>
      <form className="mb-5 flex flex-wrap gap-3" role="search">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search actions, summaries, IDs…"
          className="max-w-xs"
          aria-label="Search audit log"
        />
        <Select name="type" defaultValue={type} className="w-44" aria-label="Filter by area">
          <option value="">All areas</option>
          {ENTITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace("_", " ")}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        <p className="text-ink-muted ml-auto self-center text-sm">{total} entries</p>
      </form>

      {rows.length ? (
        <Table stack>
          <THead>
            <tr>
              <TH>When</TH>
              <TH>Who</TH>
              <TH>Action</TH>
              <TH>Details</TH>
              <TH>IP</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD className="text-ink-muted whitespace-nowrap">{dateFmt.format(r.createdAt)}</TD>
                <TD>
                  <p className="font-medium">{r.actorName ?? "System"}</p>
                  {r.actorEmail ? <p className="text-ink-muted text-xs">{r.actorEmail}</p> : null}
                </TD>
                <TD>
                  <Badge tone="accent" className="font-mono">
                    {r.action}
                  </Badge>
                </TD>
                <TD className="max-md:w-full">
                  <p className="break-words">{r.summary}</p>
                  {r.diff ? (
                    <details className="mt-1">
                      <summary className="text-ink-muted cursor-pointer text-xs">Changes</summary>
                      <pre className="bg-surface-muted rounded-control mt-1 max-w-full overflow-x-auto p-2 text-xs md:max-w-md">
                        {JSON.stringify(r.diff, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </TD>
                <TD className="text-ink-muted font-mono text-xs">{r.ip ?? "—"}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : (
        <p className="text-ink-muted py-12 text-center text-sm">No audit entries match.</p>
      )}

      {pages > 1 ? (
        <nav className="mt-5 flex items-center justify-between text-sm" aria-label="Pagination">
          {page > 1 ? (
            <Link href={qs(page - 1)} className="text-accent-ink hover:underline">
              ← Newer
            </Link>
          ) : (
            <span />
          )}
          <span className="text-ink-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={qs(page + 1)} className="text-accent-ink hover:underline">
              Older →
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </Card>
  );
}
