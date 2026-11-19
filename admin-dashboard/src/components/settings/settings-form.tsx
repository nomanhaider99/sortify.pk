"use client";

import type { SettingsMap } from "@repo/shared";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSettingsAction } from "@/app/actions/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Checkbox, Field, Textarea } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { storefrontLink } from "@/lib/links";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "money" | "bool" | "percent" | "lines" | "image" | "email" | "upper";
  hint?: string;
  wide?: boolean;
};

type Value = Record<string, unknown>;

function toInput(type: FieldDef["type"], v: unknown): string | boolean {
  if (type === "bool") return Boolean(v);
  if (type === "money") return ((v as number) / 100).toFixed(2);
  if (type === "percent") return ((v as number) / 100).toString();
  if (type === "lines") return (v as string[]).join("\n");
  return (v as string | null) ?? "";
}

function fromInput(type: FieldDef["type"], v: string | boolean): unknown {
  if (type === "bool") return v;
  const s = v as string;
  if (type === "money") return Math.round(Number(s) * 100);
  if (type === "percent") return Math.round(Number(s) * 100);
  if (type === "lines")
    return s
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  if (type === "image" && s.trim() === "") return null;
  if (type === "upper") return s.toUpperCase();
  return s;
}

export function SettingsForm({
  settingKey,
  title,
  description,
  initial,
  fields,
  disabled,
}: {
  settingKey: keyof SettingsMap;
  title: string;
  description?: string;
  initial: Value;
  fields: FieldDef[];
  disabled: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, toInput(f.type, initial[f.name])])),
  );
  const [pending, startTransition] = useTransition();
  const dirty = fields.some((f) => values[f.name] !== toInput(f.type, initial[f.name]));

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const next: Value = { ...initial };
          for (const f of fields) next[f.name] = fromInput(f.type, values[f.name] ?? "");
          startTransition(async () => {
            const r = await saveSettingsAction(settingKey, next);
            if (!r.ok) toast.error(r.error);
            else {
              toast.success(r.message ?? "Saved");
              router.refresh();
            }
          });
        }}
      >
        <div className="mb-5">
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </div>
        <fieldset disabled={disabled} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((f) => {
            const id = `${settingKey}-${f.name}`;
            const v = values[f.name];
            const set = (nv: string | boolean) => setValues((s) => ({ ...s, [f.name]: nv }));
            if (f.type === "bool")
              return (
                <label
                  key={f.name}
                  className={cn("flex items-start gap-2 text-sm", f.wide && "sm:col-span-2")}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={Boolean(v)}
                    onChange={(e) => set(e.target.checked)}
                  />
                  <span>
                    {f.label}
                    {f.hint ? <span className="text-ink-muted block text-xs">{f.hint}</span> : null}
                  </span>
                </label>
              );
            return (
              <Field
                key={f.name}
                label={f.label}
                htmlFor={id}
                hint={f.hint}
                className={cn(
                  (f.wide || f.type === "textarea" || f.type === "lines" || f.type === "image") &&
                    "sm:col-span-2",
                )}
              >
                {f.type === "textarea" || f.type === "lines" ? (
                  <Textarea
                    id={id}
                    rows={f.type === "lines" ? 4 : 3}
                    value={v as string}
                    onChange={(e) => set(e.target.value)}
                  />
                ) : f.type === "money" ? (
                  <div className="relative">
                    <span className="text-ink-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
                      $
                    </span>
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      step="0.01"
                      className="pl-6"
                      value={v as string}
                      onChange={(e) => set(e.target.value)}
                    />
                  </div>
                ) : f.type === "percent" ? (
                  <div className="relative">
                    <Input
                      id={id}
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      className="pr-8"
                      value={v as string}
                      onChange={(e) => set(e.target.value)}
                    />
                    <span className="text-ink-muted pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                      %
                    </span>
                  </div>
                ) : (
                  <Input
                    id={id}
                    type={f.type === "email" ? "email" : "text"}
                    value={v as string}
                    onChange={(e) => set(e.target.value)}
                  />
                )}
                {f.type === "image" && typeof v === "string" && v ? (
                  <div className="bg-surface-muted rounded-control relative mt-2 aspect-[16/7] w-full max-w-md overflow-hidden">
                    <Image
                      src={storefrontLink(v)}
                      alt=""
                      fill
                      sizes="448px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
              </Field>
            );
          })}
        </fieldset>
        {!disabled ? (
          <div className="mt-5 flex items-center gap-3">
            <Button type="submit" disabled={pending || !dirty}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {dirty ? <span className="text-ink-muted text-xs">Unsaved changes</span> : null}
          </div>
        ) : null}
      </form>
    </Card>
  );
}
