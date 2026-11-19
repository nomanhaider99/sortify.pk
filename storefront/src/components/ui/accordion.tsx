"use client";

import { Plus } from "lucide-react";
import { Accordion as A } from "radix-ui";
import type { ReactNode } from "react";

export type AccordionEntry = { id: string; title: string; content: ReactNode };

/** Hairline accordion (Radix — keyboard accessible, aria-expanded). */
export function Accordion({
  items,
  defaultOpen,
}: {
  items: AccordionEntry[];
  defaultOpen?: string;
}) {
  return (
    <A.Root
      type="single"
      collapsible
      defaultValue={defaultOpen}
      className="divide-border border-border divide-y border-b"
    >
      {items.map((item) => (
        <A.Item key={item.id} value={item.id} id={item.id} className="scroll-mt-32">
          <A.Header>
            <A.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium tracking-[0.06em] uppercase">
              {item.title}
              <Plus
                className="size-4 shrink-0 transition-transform duration-300 group-data-[state=open]:rotate-45"
                aria-hidden
              />
            </A.Trigger>
          </A.Header>
          <A.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_0.3s_ease-out] data-[state=open]:animate-[accordion-down_0.35s_var(--ease-out-expo)]">
            <div className="text-ink-muted pb-6 text-sm leading-relaxed">{item.content}</div>
          </A.Content>
        </A.Item>
      ))}
    </A.Root>
  );
}
