"use client";

import { BRAND, type ProductStatus } from "@repo/shared";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Trash2, Upload, X } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  saveProductAction,
  uploadProductImage,
  type ProductFormInput,
} from "@/app/actions/products";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { storefrontLink } from "@/lib/links";

type Form = Omit<ProductFormInput, "id"> & { id?: string };
type Variant = Form["variants"][number];
type Option = Form["options"][number];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const toDollars = (c: number | null) => (c === null ? "" : (c / 100).toFixed(2));
const toCents = (s: string) => (s.trim() === "" ? null : Math.round(Number(s) * 100));

/** Cartesian product of option values → variant keys ("Oak|Large"). */
function combinations(options: Option[]): string[] {
  const usable = options.filter((o) => o.name.trim() && o.values.some((v) => v.value.trim()));
  if (!usable.length) return [""];
  return usable
    .reduce<string[][]>(
      (acc, o) =>
        acc.flatMap((prefix) =>
          o.values.filter((v) => v.value.trim()).map((v) => [...prefix, v.value.trim()]),
        ),
      [[]],
    )
    .map((parts) => parts.join("|"));
}

function skuBase(title: string) {
  return (
    title
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((w) => w.slice(0, 3))
      .join("-") || "SKU"
  );
}

/** Rebuilds the variant list for the current options, keeping existing rows by key. */
function syncVariants(form: Form, token: string): Variant[] {
  const keys = combinations(form.options);
  const byKey = new Map(form.variants.map((v) => [v.key, v]));
  return keys.map((key) => {
    const existing = byKey.get(key);
    if (existing) return existing;
    const suffix = key
      ? `-${key
          .split("|")
          .map((p) =>
            p
              .toUpperCase()
              .replace(/[^A-Z0-9]/g, "")
              .slice(0, 4),
          )
          .join("-")}`
      : "";
    return {
      key,
      sku: `${skuBase(form.title)}-${token}${suffix}`,
      // New combinations start at the default price (the field labelled for that).
      priceCents: form.basePriceCents,
      compareAtPriceCents: form.compareAtPriceCents,
      stockQty: 0,
      imageUrl: null,
      isActive: true,
    };
  });
}

const EMPTY: Form = {
  title: "",
  slug: "",
  summary: "",
  description: "",
  brand: BRAND.name,
  tags: [],
  details: {},
  status: "draft",
  isFeatured: false,
  basePriceCents: 0,
  compareAtPriceCents: null,
  seoTitle: null,
  seoDescription: null,
  categoryIds: [],
  images: [],
  options: [],
  variants: [
    {
      key: "",
      sku: "",
      priceCents: 0,
      compareAtPriceCents: null,
      stockQty: 0,
      imageUrl: null,
      isActive: true,
    },
  ],
};

function MoneyInput({
  id,
  cents,
  onChange,
  disabled,
}: {
  id: string;
  cents: number | null;
  onChange: (c: number | null) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(toDollars(cents));
  return (
    <div className="relative">
      <span className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
        $
      </span>
      <Input
        id={id}
        inputMode="decimal"
        className="pl-6 tabular-nums"
        value={text}
        disabled={disabled}
        onChange={(e) => {
          setText(e.target.value);
          const c = toCents(e.target.value);
          if (c === null || Number.isFinite(c)) onChange(c);
        }}
        onBlur={() => setText(toDollars(toCents(text)))}
      />
    </div>
  );
}

export function ProductEditor({
  product,
  categories,
  library,
  uploadsEnabled,
  canPublish,
  readOnly = false,
}: {
  product: (Form & { id: string }) | null;
  categories: { id: string; name: string }[];
  library: string[];
  uploadsEnabled: boolean;
  canPublish: boolean;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(product ?? EMPTY);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  // Short random token so generated SKUs stay unique across similarly named products.
  const [skuToken] = useState(() => Math.random().toString(36).slice(2, 5).toUpperCase());
  const [tagDraft, setTagDraft] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const hasOptions = form.options.length > 0;

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const setOptions = (options: Option[]) =>
    setForm((f) => ({ ...f, options, variants: syncVariants({ ...f, options }, skuToken) }));
  const setVariant = (i: number, patch: Partial<Variant>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, j) => (j === i ? { ...v, ...patch } : v)),
    }));

  const totalStock = useMemo(
    () => form.variants.reduce((s, v) => s + (v.isActive ? v.stockQty : 0), 0),
    [form.variants],
  );

  const addImage = (url: string) => {
    if (form.images.some((i) => i.url === url)) return;
    set("images", [...form.images, { url, alt: form.title }]);
  };
  const moveImage = (i: number, dir: -1 | 1) => {
    const imgs = [...form.images];
    const j = i + dir;
    if (j < 0 || j >= imgs.length) return;
    const [img] = imgs.splice(i, 1);
    if (!img) return;
    imgs.splice(j, 0, img);
    set("images", imgs);
  };

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    const r = await uploadProductImage(fd);
    setUploading(false);
    if (r.ok) addImage(r.data.url);
    else toast.error(r.error);
  };

  const save = (status?: ProductStatus) => {
    const payload: ProductFormInput = {
      ...form,
      status: status ?? form.status,
      // Single-variant products mirror the base price onto their only variant.
      variants: hasOptions
        ? form.variants
        : form.variants.slice(0, 1).map((v) => ({
            ...v,
            key: "",
            priceCents: form.basePriceCents,
            compareAtPriceCents: form.compareAtPriceCents,
          })),
      basePriceCents: hasOptions
        ? Math.min(...form.variants.map((v) => v.priceCents))
        : form.basePriceCents,
    };
    startTransition(async () => {
      const r = await saveProductAction(payload);
      if (!r.ok) {
        toast.error(r.error);
        return;
      }
      toast.success(r.message ?? "Saved");
      if (!product) router.replace(`/products/${r.data.id}` as Route);
      else {
        setForm((f) => ({ ...f, status: payload.status }));
        router.refresh();
      }
    });
  };

  const single = form.variants[0];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={"/products"}
          className="text-ink-muted hover:text-ink inline-flex min-h-10 items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> Products
        </Link>
        <div className="flex items-center gap-2">
          {product ? (
            <a
              href={storefrontLink(`/products/${product.slug}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-ink inline-flex min-h-10 items-center text-sm hover:underline"
            >
              View in store
            </a>
          ) : null}
          {!readOnly ? (
            <>
              <Button type="submit" variant="secondary" disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
              {form.status !== "active" && canPublish ? (
                <Button type="button" disabled={pending} onClick={() => save("active")}>
                  Save & publish
                </Button>
              ) : null}
            </>
          ) : (
            <Badge tone="neutral">Read only</Badge>
          )}
        </div>
      </div>

      <fieldset
        disabled={readOnly}
        className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]"
      >
        <div className="min-w-0 space-y-6">
          <Card className="space-y-4">
            <Field label="Title" htmlFor="title">
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((f) => ({
                    ...f,
                    title,
                    ...(slugTouched ? {} : { slug: slugify(title) }),
                  }));
                }}
              />
            </Field>
            <Field label="Summary" htmlFor="summary" hint="One or two lines shown near the price">
              <Textarea
                id="summary"
                rows={2}
                maxLength={300}
                value={form.summary}
                onChange={(e) => set("summary", e.target.value)}
              />
            </Field>
            <Field
              label="Description"
              htmlFor="description"
              hint="Plain text; blank lines start new paragraphs"
            >
              <Textarea
                id="description"
                rows={8}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Dimensions" htmlFor="dim">
                <Input
                  id="dim"
                  value={form.details.dimensions ?? ""}
                  onChange={(e) => set("details", { ...form.details, dimensions: e.target.value })}
                />
              </Field>
              <Field label="Materials" htmlFor="mat">
                <Input
                  id="mat"
                  value={form.details.materials ?? ""}
                  onChange={(e) => set("details", { ...form.details, materials: e.target.value })}
                />
              </Field>
              <Field label="Care" htmlFor="care">
                <Input
                  id="care"
                  value={form.details.care ?? ""}
                  onChange={(e) => set("details", { ...form.details, care: e.target.value })}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Images</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setPickerOpen(true)}
                >
                  <ImagePlus aria-hidden /> Library
                </Button>
                {uploadsEnabled ? (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={uploading}
                      onClick={() => fileRef.current?.click()}
                    >
                      <Upload aria-hidden /> {uploading ? "Uploading…" : "Upload"}
                    </Button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void upload(f);
                        e.target.value = "";
                      }}
                    />
                  </>
                ) : null}
              </div>
            </div>
            {form.images.length ? (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {form.images.map((img, i) => (
                  <li key={img.url} className="border-border rounded-card overflow-hidden border">
                    <div className="bg-surface-muted relative aspect-square">
                      <Image
                        src={storefrontLink(img.url)}
                        alt=""
                        fill
                        sizes="200px"
                        className="object-cover"
                        unoptimized
                      />
                      {i === 0 ? <Badge className="absolute top-2 left-2">Cover</Badge> : null}
                    </div>
                    <div className="space-y-2 p-2">
                      <label className="sr-only" htmlFor={`alt-${i}`}>
                        Alt text
                      </label>
                      <Input
                        id={`alt-${i}`}
                        className="h-8 text-xs"
                        placeholder="Alt text"
                        value={img.alt}
                        onChange={(e) =>
                          set(
                            "images",
                            form.images.map((x, j) =>
                              j === i ? { ...x, alt: e.target.value } : x,
                            ),
                          )
                        }
                      />
                      <div className="flex justify-between">
                        <div className="flex">
                          <button
                            type="button"
                            className="text-ink-muted hover:text-ink p-1.5 disabled:opacity-30"
                            disabled={i === 0}
                            onClick={() => moveImage(i, -1)}
                            aria-label="Move earlier"
                          >
                            <ArrowLeft className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            className="text-ink-muted hover:text-ink p-1.5 disabled:opacity-30"
                            disabled={i === form.images.length - 1}
                            onClick={() => moveImage(i, 1)}
                            aria-label="Move later"
                          >
                            <ArrowRight className="size-3.5" aria-hidden />
                          </button>
                        </div>
                        <button
                          type="button"
                          className="text-danger p-1.5"
                          onClick={() =>
                            set(
                              "images",
                              form.images.filter((_, j) => j !== i),
                            )
                          }
                          aria-label="Remove image"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-muted border-border rounded-card border border-dashed py-10 text-center text-sm">
                No images yet — add from the library or paste a URL.
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <label htmlFor="img-url" className="sr-only">
                Image URL
              </label>
              <Input
                id="img-url"
                placeholder="Paste an https:// image URL"
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                disabled={!/^https:\/\/.+/.test(urlDraft.trim())}
                onClick={() => {
                  addImage(urlDraft.trim());
                  setUrlDraft("");
                }}
              >
                Add
              </Button>
            </div>
          </Card>

          <Card className="space-y-4">
            <CardTitle>Pricing</CardTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label={hasOptions ? "Default price (new variants)" : "Price"} htmlFor="price">
                <MoneyInput
                  id="price"
                  cents={form.basePriceCents}
                  onChange={(c) => set("basePriceCents", c ?? 0)}
                />
              </Field>
              <Field
                label="Compare-at price"
                htmlFor="compare"
                hint="Shows as a strike-through sale price"
              >
                <MoneyInput
                  id="compare"
                  cents={form.compareAtPriceCents}
                  onChange={(c) => set("compareAtPriceCents", c)}
                />
              </Field>
            </div>
            {!hasOptions && single ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="SKU" htmlFor="sku">
                  <Input
                    id="sku"
                    required
                    value={single.sku}
                    onChange={(e) => setVariant(0, { sku: e.target.value.toUpperCase() })}
                  />
                </Field>
                <Field label="Stock" htmlFor="stock">
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    value={single.stockQty}
                    onChange={(e) =>
                      setVariant(0, { stockQty: Math.max(0, Number(e.target.value) || 0) })
                    }
                  />
                </Field>
              </div>
            ) : null}
          </Card>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <CardTitle>Options & variants</CardTitle>
                <p className="text-ink-muted text-sm">
                  e.g. Finish (Oak, Walnut) × Size (Small, Large)
                </p>
              </div>
              {form.options.length < 3 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setOptions([
                      ...form.options,
                      { name: "", values: [{ value: "", swatchHex: null }] },
                    ])
                  }
                >
                  <Plus aria-hidden /> Add option
                </Button>
              ) : null}
            </div>
            <div className="space-y-4">
              {form.options.map((o, oi) => (
                <div key={oi} className="border-border rounded-card space-y-3 border p-4">
                  <div className="flex items-end gap-2">
                    <Field label="Option name" htmlFor={`opt-${oi}`} className="flex-1">
                      <Input
                        id={`opt-${oi}`}
                        value={o.name}
                        placeholder="Finish"
                        onChange={(e) =>
                          setOptions(
                            form.options.map((x, j) =>
                              j === oi ? { ...x, name: e.target.value } : x,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Remove option"
                      onClick={() => setOptions(form.options.filter((_, j) => j !== oi))}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {o.values.map((v, vi) => (
                      <div
                        key={vi}
                        className="border-border bg-surface flex items-center gap-1 rounded-full border py-1 pr-1 pl-3"
                      >
                        <input
                          aria-label={`${o.name || "Option"} value ${vi + 1}`}
                          className="h-7 w-24 bg-transparent text-sm outline-none"
                          value={v.value}
                          placeholder="Value"
                          onChange={(e) =>
                            setOptions(
                              form.options.map((x, j) =>
                                j === oi
                                  ? {
                                      ...x,
                                      values: x.values.map((y, k) =>
                                        k === vi ? { ...y, value: e.target.value } : y,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                        <input
                          type="color"
                          aria-label="Swatch colour"
                          title="Swatch colour (optional)"
                          className="size-7 cursor-pointer rounded-full border-0 bg-transparent p-0"
                          value={v.swatchHex ?? "#9caf88"}
                          onChange={(e) =>
                            setOptions(
                              form.options.map((x, j) =>
                                j === oi
                                  ? {
                                      ...x,
                                      values: x.values.map((y, k) =>
                                        k === vi ? { ...y, swatchHex: e.target.value } : y,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          aria-label="Remove value"
                          className="text-ink-muted hover:text-ink p-1.5"
                          onClick={() =>
                            setOptions(
                              form.options.map((x, j) =>
                                j === oi
                                  ? { ...x, values: x.values.filter((_, k) => k !== vi) }
                                  : x,
                              ),
                            )
                          }
                        >
                          <X className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-accent-ink rounded-full px-3 py-1 text-sm hover:underline"
                      onClick={() =>
                        setOptions(
                          form.options.map((x, j) =>
                            j === oi
                              ? { ...x, values: [...x.values, { value: "", swatchHex: null }] }
                              : x,
                          ),
                        )
                      }
                    >
                      + Add value
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {hasOptions ? (
              <div className="mt-5 overflow-x-auto">
                {/* Phones: each variant is a small card with labelled fields */}
                <table className="w-full text-sm max-md:block md:min-w-[640px]">
                  <thead className="text-ink-muted text-left text-xs max-md:hidden">
                    <tr>
                      <th className="py-2 pr-3 font-medium">Variant</th>
                      <th className="py-2 pr-3 font-medium">SKU</th>
                      <th className="py-2 pr-3 font-medium">Price</th>
                      <th className="py-2 pr-3 font-medium">Stock</th>
                      <th className="py-2 pr-3 font-medium">Image</th>
                      <th className="py-2 font-medium">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y max-md:block">
                    {form.variants.map((v, i) => (
                      <tr
                        key={v.key}
                        className={cn(
                          "max-md:grid max-md:grid-cols-2 max-md:gap-3 max-md:py-4",
                          !v.isActive && "opacity-60",
                        )}
                      >
                        <td className="py-2 pr-3 font-medium whitespace-nowrap max-md:col-span-2 max-md:p-0">
                          {v.key.split("|").join(" / ") || "Default"}
                        </td>
                        <td
                          data-label="SKU"
                          className="max-md:before:text-ink-muted py-2 pr-3 max-md:col-span-2 max-md:p-0 max-md:before:mb-1 max-md:before:block max-md:before:text-xs max-md:before:content-[attr(data-label)]"
                        >
                          <Input
                            aria-label={`SKU for ${v.key}`}
                            className="h-8 w-full md:w-52"
                            value={v.sku}
                            onChange={(e) => setVariant(i, { sku: e.target.value.toUpperCase() })}
                          />
                        </td>
                        <td
                          data-label="Price"
                          className="max-md:before:text-ink-muted w-32 py-2 pr-3 max-md:w-auto max-md:p-0 max-md:before:mb-1 max-md:before:block max-md:before:text-xs max-md:before:content-[attr(data-label)]"
                        >
                          <MoneyInput
                            id={`vp-${i}`}
                            cents={v.priceCents}
                            onChange={(c) => setVariant(i, { priceCents: c ?? 0 })}
                          />
                        </td>
                        <td
                          data-label="Stock"
                          className="max-md:before:text-ink-muted py-2 pr-3 max-md:p-0 max-md:before:mb-1 max-md:before:block max-md:before:text-xs max-md:before:content-[attr(data-label)]"
                        >
                          <Input
                            aria-label={`Stock for ${v.key}`}
                            type="number"
                            min={0}
                            className="h-8 w-full md:w-20"
                            value={v.stockQty}
                            onChange={(e) =>
                              setVariant(i, { stockQty: Math.max(0, Number(e.target.value) || 0) })
                            }
                          />
                        </td>
                        <td
                          data-label="Image"
                          className="max-md:before:text-ink-muted py-2 pr-3 max-md:p-0 max-md:before:mb-1 max-md:before:block max-md:before:text-xs max-md:before:content-[attr(data-label)]"
                        >
                          <Select
                            aria-label={`Image for ${v.key}`}
                            className="h-8 w-full text-xs md:w-32"
                            value={v.imageUrl ?? ""}
                            onChange={(e) => setVariant(i, { imageUrl: e.target.value || null })}
                          >
                            <option value="">Product cover</option>
                            {form.images.map((img, k) => (
                              <option key={img.url} value={img.url}>
                                Image {k + 1}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td
                          data-label="Active"
                          className="max-md:before:text-ink-muted py-2 max-md:p-0 max-md:before:mb-1 max-md:before:block max-md:before:text-xs max-md:before:content-[attr(data-label)]"
                        >
                          <Checkbox
                            aria-label={`Active ${v.key}`}
                            checked={v.isActive}
                            onChange={(e) => setVariant(i, { isActive: e.target.checked })}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-ink-muted mt-2 text-xs">
                  {form.variants.length} variants · {totalStock} in stock. Existing variants keep
                  their history when options change.
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-4">
            <CardTitle>Search engine listing</CardTitle>
            <Field label="URL handle" htmlFor="slug" hint={`/products/${form.slug || "…"}`}>
              <Input
                id="slug"
                required
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field
              label="SEO title"
              htmlFor="seo-title"
              hint={`${(form.seoTitle ?? "").length}/70`}
            >
              <Input
                id="seo-title"
                maxLength={70}
                value={form.seoTitle ?? ""}
                onChange={(e) => set("seoTitle", e.target.value || null)}
                placeholder={form.title}
              />
            </Field>
            <Field
              label="SEO description"
              htmlFor="seo-desc"
              hint={`${(form.seoDescription ?? "").length}/170`}
            >
              <Textarea
                id="seo-desc"
                rows={2}
                maxLength={170}
                value={form.seoDescription ?? ""}
                onChange={(e) => set("seoDescription", e.target.value || null)}
                placeholder={form.summary}
              />
            </Field>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-4">
            <CardTitle>Status</CardTitle>
            <Select
              aria-label="Status"
              value={form.status}
              onChange={(e) => set("status", e.target.value as ProductStatus)}
            >
              <option value="draft">Draft</option>
              <option value="active" disabled={!canPublish && product?.status !== "active"}>
                Active{!canPublish ? " (needs publish permission)" : ""}
              </option>
              <option value="archived">Archived</option>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.isFeatured}
                onChange={(e) => set("isFeatured", e.target.checked)}
              />{" "}
              Feature on the homepage
            </label>
          </Card>
          <Card className="space-y-3">
            <CardTitle>Categories</CardTitle>
            {categories.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.categoryIds.includes(c.id)}
                  onChange={(e) =>
                    set(
                      "categoryIds",
                      e.target.checked
                        ? [...form.categoryIds, c.id]
                        : form.categoryIds.filter((x) => x !== c.id),
                    )
                  }
                />
                {c.name}
              </label>
            ))}
          </Card>
          <Card className="space-y-4">
            <CardTitle>Organisation</CardTitle>
            <Field label="Brand" htmlFor="brand">
              <Input id="brand" value={form.brand} onChange={(e) => set("brand", e.target.value)} />
            </Field>
            <div className="space-y-1.5">
              <label htmlFor="tag" className="block text-sm font-medium">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {form.tags.map((t) => (
                  <span
                    key={t}
                    className="bg-surface-muted inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs"
                  >
                    {t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      className="-my-1 p-1.5"
                      onClick={() =>
                        set(
                          "tags",
                          form.tags.filter((x) => x !== t),
                        )
                      }
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
              <Input
                id="tag"
                placeholder="Type and press Enter"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const t = tagDraft.trim().toLowerCase();
                    if (t && !form.tags.includes(t) && form.tags.length < 20)
                      set("tags", [...form.tags, t]);
                    setTagDraft("");
                  }
                }}
              />
            </div>
          </Card>
        </div>
      </fieldset>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent
          title="Image library"
          description="Images already used in your store."
          className="w-[min(860px,calc(100vw-2rem))]"
        >
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {library.map((url) => {
              const used = form.images.some((i) => i.url === url);
              return (
                <li key={url}>
                  <button
                    type="button"
                    disabled={used}
                    onClick={() => addImage(url)}
                    className={cn(
                      "rounded-control relative block aspect-square w-full overflow-hidden border-2",
                      used
                        ? "border-primary-strong opacity-60"
                        : "hover:border-primary border-transparent",
                    )}
                    aria-label={used ? `Added: ${url}` : `Add ${url}`}
                  >
                    <Image
                      src={storefrontLink(url)}
                      alt=""
                      fill
                      sizes="160px"
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </DialogContent>
      </Dialog>
    </form>
  );
}
