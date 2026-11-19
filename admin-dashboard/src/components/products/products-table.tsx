"use client";

import type { ProductStatus } from "@repo/shared";
import { Copy, Search, Star } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  bulkAddCategory,
  bulkDeleteProducts,
  bulkProductStatus,
  duplicateProductAction,
  inlineUpdateVariant,
} from "@/app/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { LocalTime } from "@/components/ui/local-time";
import { storefrontLink } from "@/lib/links";

type Row = {
  id: string;
  slug: string;
  title: string;
  status: ProductStatus;
  isFeatured: boolean;
  updatedAt: string;
  image: string | null;
  stock: number;
  variantCount: number;
  singleVariantId: string | null;
  minPrice: number;
  maxPrice: number;
  categoryNames: string | null;
};

const STATUS_TONE = { active: "success", draft: "warning", archived: "neutral" } as const;

/** Click-to-edit cell for price (dollars) or stock on single-variant products, with undo. */
function InlineCell({
  variantId,
  field,
  value,
  disabled,
}: {
  variantId: string;
  field: "priceCents" | "stockQty";
  value: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const show = field === "priceCents" ? money(value) : String(value);

  const commit = () => {
    const n = field === "priceCents" ? Math.round(Number(draft) * 100) : Math.round(Number(draft));
    setEditing(false);
    if (!Number.isFinite(n) || n < 0 || n === value) return;
    startTransition(async () => {
      const r = await inlineUpdateVariant(variantId, { [field]: n });
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      const prev = r.data.before[field];
      toast.success(`${field === "priceCents" ? "Price" : "Stock"} updated`, {
        action: {
          label: "Undo",
          onClick: () => {
            void inlineUpdateVariant(variantId, { [field]: prev }).then(() => router.refresh());
          },
        },
      });
      router.refresh();
    });
  };

  if (disabled) return <span className="tabular-nums">{show}</span>;
  if (editing)
    return (
      <Input
        autoFocus
        type="number"
        step={field === "priceCents" ? "0.01" : "1"}
        min={0}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
        className="h-8 w-24"
        aria-label={field === "priceCents" ? "Price" : "Stock"}
      />
    );
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setDraft(field === "priceCents" ? (value / 100).toFixed(2) : String(value));
        setEditing(true);
      }}
      className="hover:border-border rounded-control -mx-1.5 inline-flex min-h-7 min-w-7 items-center justify-center border border-transparent px-1.5 py-0.5 tabular-nums"
      title="Click to edit"
    >
      {show}
    </button>
  );
}

export function ProductsTable({
  rows,
  total,
  page,
  categories,
  can,
}: {
  rows: Row[];
  total: number;
  page: number;
  categories: { id: string; name: string }[];
  can: { update: boolean; publish: boolean; delete: boolean; create: boolean };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, startTransition] = useTransition();

  const setParam = (updates: Record<string, string | null>) => {
    const p = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    if (!("page" in updates)) p.delete("page");
    router.replace(`${pathname}?${p.toString()}` as Route, { scroll: false });
  };

  const runBulk = (
    fn: () => Promise<{ ok: boolean; error?: string; message?: string }>,
    done: string,
  ) =>
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) toast.error(r.error ?? "Failed");
      else {
        toast.success(r.message ?? done);
        setChecked(new Set());
        router.refresh();
      }
    });

  const ids = [...checked];
  const allChecked = rows.length > 0 && rows.every((r) => checked.has(r.id));
  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <Card className="p-0">
      <div className="border-border flex flex-wrap items-center gap-2 border-b p-4">
        <form
          role="search"
          className="relative w-full min-w-0 sm:w-auto sm:min-w-56 sm:flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ q: q.trim() || null });
          }}
        >
          <Search
            className="text-ink-muted absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, handle or SKU"
            className="pl-9"
            aria-label="Search products"
          />
        </form>
        <Select
          aria-label="Status"
          value={sp.get("status") ?? ""}
          onChange={(e) => setParam({ status: e.target.value || null })}
          className="min-w-0 flex-1 sm:w-36 sm:flex-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <Select
          aria-label="Category"
          value={sp.get("category") ?? ""}
          onChange={(e) => setParam({ category: e.target.value || null })}
          className="min-w-0 flex-1 sm:w-44 sm:flex-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Stock"
          value={sp.get("stock") ?? ""}
          onChange={(e) => setParam({ stock: e.target.value || null })}
          className="min-w-0 flex-1 sm:w-36 sm:flex-none"
        >
          <option value="">Any stock</option>
          <option value="low">Low (1–5)</option>
          <option value="out">Out of stock</option>
        </Select>
      </div>

      {checked.size ? (
        <div className="bg-primary-soft border-border flex flex-wrap items-center gap-2 border-b px-4 py-2 text-sm">
          <span className="font-medium">{checked.size} selected</span>
          {can.publish ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() => runBulk(() => bulkProductStatus(ids, "active"), "Published")}
            >
              Publish
            </Button>
          ) : null}
          {can.update ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => runBulk(() => bulkProductStatus(ids, "draft"), "Moved to draft")}
              >
                Unpublish
              </Button>
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() => runBulk(() => bulkProductStatus(ids, "archived"), "Archived")}
              >
                Archive
              </Button>
              <Select
                aria-label="Add to category"
                className="h-8 w-44 text-xs"
                value=""
                disabled={pending}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id) runBulk(() => bulkAddCategory(ids, id), "Category added");
                }}
              >
                <option value="">Add to category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </>
          ) : null}
          {can.delete ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger"
              disabled={pending}
              onClick={() =>
                window.confirm(
                  `Delete ${checked.size} product(s)? They’ll disappear from the store; order history is kept.`,
                ) && runBulk(() => bulkDeleteProducts(ids), "Deleted")
              }
            >
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Phones: stacked cards instead of a wide table */}
      <ul className="divide-border divide-y md:hidden" aria-label="Products">
        {rows.length ? (
          <li className="flex items-center gap-3 px-4 py-2">
            <label className="text-ink-muted flex min-h-10 items-center gap-3 text-xs">
              <input
                type="checkbox"
                className="accent-primary-strong size-5"
                checked={allChecked}
                onChange={() => setChecked(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
              />
              Select all
            </label>
          </li>
        ) : null}
        {rows.map((r) => (
          <li key={r.id} className="flex gap-3 px-4 py-3">
            <label className="flex min-h-10 items-start pt-2.5">
              <input
                type="checkbox"
                className="accent-primary-strong size-5"
                checked={checked.has(r.id)}
                onChange={() =>
                  setChecked((s) => {
                    const n = new Set(s);
                    if (n.has(r.id)) n.delete(r.id);
                    else n.add(r.id);
                    return n;
                  })
                }
                aria-label={`Select ${r.title}`}
              />
            </label>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${r.id}` as Route} className="flex items-center gap-3">
                <span className="bg-surface-muted rounded-control relative size-14 shrink-0 overflow-hidden">
                  {r.image ? (
                    <Image
                      src={storefrontLink(r.image)}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1 font-medium">
                    <span className="truncate">{r.title}</span>
                    {r.isFeatured ? (
                      <Star
                        className="text-warning-ink size-3.5 shrink-0 fill-current"
                        aria-label="Featured"
                      />
                    ) : null}
                  </span>
                  <span className="text-ink-muted mt-0.5 block truncate text-xs">
                    {r.variantCount} variant{r.variantCount === 1 ? "" : "s"}
                    {r.categoryNames ? ` · ${r.categoryNames}` : ""}
                  </span>
                </span>
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                <span className="flex items-center gap-1">
                  <span className="text-ink-muted text-xs">Price</span>
                  {r.singleVariantId ? (
                    <InlineCell
                      variantId={r.singleVariantId}
                      field="priceCents"
                      value={r.minPrice}
                      disabled={!can.update}
                    />
                  ) : (
                    <span className="tabular-nums">
                      {r.minPrice === r.maxPrice
                        ? money(r.minPrice)
                        : `${money(r.minPrice)}–${money(r.maxPrice)}`}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    r.stock === 0 ? "text-danger" : r.stock <= 5 ? "text-warning-ink" : "",
                  )}
                >
                  <span className="text-ink-muted text-xs">Stock</span>
                  {r.singleVariantId ? (
                    <InlineCell
                      variantId={r.singleVariantId}
                      field="stockQty"
                      value={r.stock}
                      disabled={!can.update}
                    />
                  ) : (
                    <span className="tabular-nums">{r.stock}</span>
                  )}
                </span>
              </div>
            </div>
            {can.create ? (
              <button
                type="button"
                title="Duplicate"
                aria-label={`Duplicate ${r.title}`}
                disabled={pending}
                className="text-ink-muted hover:text-ink -mr-2 flex size-10 shrink-0 items-center justify-center"
                onClick={() =>
                  startTransition(async () => {
                    const res = await duplicateProductAction(r.id);
                    if (!res.ok) toast.error(res.error);
                    else {
                      toast.success("Duplicated as a draft");
                      router.push(`/products/${res.data.id}` as Route);
                    }
                  })
                }
              >
                <Copy className="size-4" aria-hidden />
              </button>
            ) : null}
          </li>
        ))}
        {!rows.length ? (
          <li className="text-ink-muted py-16 text-center text-sm">No products match.</li>
        ) : null}
      </ul>

      <div className="hidden md:block">
        <Table bleed={false}>
          <THead>
            <TR>
              <TH className="w-10">
                <input
                  type="checkbox"
                  className="accent-primary-strong size-4"
                  checked={allChecked}
                  onChange={() =>
                    setChecked(allChecked ? new Set() : new Set(rows.map((r) => r.id)))
                  }
                  aria-label="Select all products"
                />
              </TH>
              <TH>Product</TH>
              <TH>Status</TH>
              <TH>Price</TH>
              <TH>Stock</TH>
              <TH>Categories</TH>
              <TH>Updated</TH>
              <TH className="w-10">
                <span className="sr-only">Actions</span>
              </TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>
                  <input
                    type="checkbox"
                    className="accent-primary-strong size-4"
                    checked={checked.has(r.id)}
                    onChange={() =>
                      setChecked((s) => {
                        const n = new Set(s);
                        if (n.has(r.id)) n.delete(r.id);
                        else n.add(r.id);
                        return n;
                      })
                    }
                    aria-label={`Select ${r.title}`}
                  />
                </TD>
                <TD>
                  <Link
                    href={`/products/${r.id}` as Route}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <span className="bg-surface-muted rounded-control relative size-10 shrink-0 overflow-hidden">
                      {r.image ? (
                        <Image
                          src={storefrontLink(r.image)}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                          unoptimized
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 font-medium">
                        {r.title}
                        {r.isFeatured ? (
                          <Star
                            className="text-warning-ink size-3.5 fill-current"
                            aria-label="Featured"
                          />
                        ) : null}
                      </span>
                      <span className="text-ink-muted block text-xs">
                        {r.variantCount} variant{r.variantCount === 1 ? "" : "s"}
                      </span>
                    </span>
                  </Link>
                </TD>
                <TD>
                  <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                </TD>
                <TD>
                  {r.singleVariantId ? (
                    <InlineCell
                      variantId={r.singleVariantId}
                      field="priceCents"
                      value={r.minPrice}
                      disabled={!can.update}
                    />
                  ) : (
                    <span className="tabular-nums">
                      {r.minPrice === r.maxPrice
                        ? money(r.minPrice)
                        : `${money(r.minPrice)}–${money(r.maxPrice)}`}
                    </span>
                  )}
                </TD>
                <TD
                  className={cn(
                    r.stock === 0 ? "text-danger" : r.stock <= 5 ? "text-warning-ink" : "",
                  )}
                >
                  {r.singleVariantId ? (
                    <InlineCell
                      variantId={r.singleVariantId}
                      field="stockQty"
                      value={r.stock}
                      disabled={!can.update}
                    />
                  ) : (
                    <span className="tabular-nums">{r.stock}</span>
                  )}
                </TD>
                <TD className="text-ink-muted max-w-48 truncate text-xs">
                  {r.categoryNames ?? "—"}
                </TD>
                <TD className="text-ink-muted text-xs whitespace-nowrap">
                  <LocalTime value={r.updatedAt} format="ago" />
                </TD>
                <TD>
                  {can.create ? (
                    <button
                      type="button"
                      title="Duplicate"
                      aria-label={`Duplicate ${r.title}`}
                      disabled={pending}
                      className="text-ink-muted hover:text-ink p-1"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await duplicateProductAction(r.id);
                          if (!res.ok) toast.error(res.error);
                          else {
                            toast.success("Duplicated as a draft");
                            router.push(`/products/${res.data.id}` as Route);
                          }
                        })
                      }
                    >
                      <Copy className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </TD>
              </TR>
            ))}
            {!rows.length ? (
              <TR>
                <TD colSpan={8} className="text-ink-muted py-16 text-center">
                  No products match.
                </TD>
              </TR>
            ) : null}
          </TBody>
        </Table>
      </div>
      {pages > 1 ? (
        <div className="border-border flex items-center justify-between border-t px-4 py-3 text-sm">
          <span className="text-ink-muted">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setParam({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= pages}
              onClick={() => setParam({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
