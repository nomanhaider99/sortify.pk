"use client";

import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteCategoryAction,
  reorderCategoriesAction,
  saveCategoryAction,
} from "@/app/actions/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox, Field, Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { storefrontLink } from "@/lib/links";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  isVisible: boolean;
  showInMenu: boolean;
  productCount: number;
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function CategoryForm({ initial, onDone }: { initial: Category | null; onDone: () => void }) {
  const router = useRouter();
  const [v, setV] = useState({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    imageUrl: initial?.imageUrl ?? "",
    isVisible: initial?.isVisible ?? true,
    showInMenu: initial?.showInMenu ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [pending, startTransition] = useTransition();
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const r = await saveCategoryAction({ ...v, ...(initial ? { id: initial.id } : {}) });
          if (!r.ok) toast.error(r.error);
          else {
            toast.success(r.message ?? "Saved");
            onDone();
            router.refresh();
          }
        });
      }}
    >
      <Field label="Name" htmlFor="cat-name">
        <Input
          id="cat-name"
          required
          value={v.name}
          onChange={(e) =>
            setV((s) => ({
              ...s,
              name: e.target.value,
              ...(slugTouched ? {} : { slug: slugify(e.target.value) }),
            }))
          }
        />
      </Field>
      <Field label="URL handle" htmlFor="cat-slug" hint={`/categories/${v.slug || "…"}`}>
        <Input
          id="cat-slug"
          required
          value={v.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setV((s) => ({ ...s, slug: slugify(e.target.value) }));
          }}
        />
      </Field>
      <Field label="Description" htmlFor="cat-desc">
        <Textarea
          id="cat-desc"
          rows={3}
          maxLength={400}
          value={v.description}
          onChange={(e) => setV((s) => ({ ...s, description: e.target.value }))}
        />
      </Field>
      <Field
        label="Image URL"
        htmlFor="cat-img"
        hint="A library path like /images/… or an https:// URL"
      >
        <Input
          id="cat-img"
          value={v.imageUrl}
          onChange={(e) => setV((s) => ({ ...s, imageUrl: e.target.value }))}
        />
      </Field>
      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={v.isVisible}
            onChange={(e) => setV((s) => ({ ...s, isVisible: e.target.checked }))}
          />{" "}
          Visible in store
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={v.showInMenu}
            onChange={(e) => setV((s) => ({ ...s, showInMenu: e.target.checked }))}
          />{" "}
          Show in menu
        </label>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save category"}
      </Button>
    </form>
  );
}

export function CategoriesManager({
  categories,
  can,
}: {
  categories: Category[];
  can: { create: boolean; update: boolean; delete: boolean };
}) {
  const router = useRouter();
  const [list, setList] = useState(categories);
  const [dragId, setDragId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const [pending, startTransition] = useTransition();
  // Re-sync when the server sends a fresh list (after refresh).
  const [prevCategories, setPrevCategories] = useState(categories);
  if (prevCategories !== categories) {
    setPrevCategories(categories);
    setList(categories);
  }

  const persist = (next: Category[]) => {
    setList(next);
    startTransition(async () => {
      const r = await reorderCategoriesAction(next.map((c) => c.id));
      if (!r.ok) {
        toast.error(r.error);
        setList(categories);
      } else toast.success("Order saved");
    });
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length || from === to) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    if (!item) return;
    next.splice(to, 0, item);
    persist(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-ink-muted text-sm">
          Drag to set the order used in the menu and on the homepage.
        </p>
        {can.create ? (
          <Button onClick={() => setEditing("new")}>
            <Plus aria-hidden /> Add category
          </Button>
        ) : null}
      </div>
      <Card className="p-0">
        <ul className="divide-border divide-y" aria-label="Categories">
          {list.map((c, i) => (
            <li
              key={c.id}
              draggable={can.update}
              onDragStart={() => setDragId(c.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                const from = list.findIndex((x) => x.id === dragId);
                setDragId(null);
                if (from !== -1) move(from, i);
              }}
              onDragEnd={() => setDragId(null)}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3",
                dragId === c.id && "opacity-50",
              )}
            >
              {can.update ? (
                <GripVertical className="text-ink-muted size-4 shrink-0 cursor-grab" aria-hidden />
              ) : null}
              <span className="bg-surface-muted rounded-control relative size-12 shrink-0 overflow-hidden">
                {c.imageUrl ? (
                  <Image
                    src={storefrontLink(c.imageUrl)}
                    alt=""
                    fill
                    sizes="48px"
                    className="object-cover"
                    unoptimized
                  />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.name}</p>
                <p className="text-ink-muted truncate text-xs">
                  /{c.slug} · {c.productCount} product{c.productCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className="hidden gap-1.5 sm:flex">
                {!c.isVisible ? <Badge tone="neutral">Hidden</Badge> : null}
                {c.isVisible && !c.showInMenu ? <Badge tone="neutral">Not in menu</Badge> : null}
              </div>
              {/* Actions: own row on phones, inline from sm */}
              <div className="flex w-full justify-end sm:w-auto">
                {can.update ? (
                  <div className="flex">
                    {/* Keyboard/touch alternative to drag-and-drop */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${c.name} up`}
                      disabled={i === 0 || pending}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUp aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Move ${c.name} down`}
                      disabled={i === list.length - 1 || pending}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDown aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${c.name}`}
                      onClick={() => setEditing(c)}
                    >
                      <Pencil aria-hidden />
                    </Button>
                  </div>
                ) : null}
                {can.delete ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-danger"
                    aria-label={`Delete ${c.name}`}
                    onClick={() => {
                      if (
                        !window.confirm(
                          `Delete “${c.name}”? Products stay, but are removed from this category.`,
                        )
                      )
                        return;
                      startTransition(async () => {
                        const r = await deleteCategoryAction(c.id);
                        if (!r.ok) toast.error(r.error);
                        else {
                          toast.success("Category deleted");
                          router.refresh();
                        }
                      });
                    }}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
          {!list.length ? (
            <li className="text-ink-muted py-16 text-center text-sm">No categories yet.</li>
          ) : null}
        </ul>
      </Card>
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title={editing === "new" ? "New category" : "Edit category"}>
          {editing !== null ? (
            <CategoryForm
              initial={editing === "new" ? null : editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
