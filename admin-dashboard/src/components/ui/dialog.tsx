"use client";

import { X } from "lucide-react";
import { Dialog as D } from "radix-ui";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <D.Portal>
      <D.Overlay className="bg-ink/40 fixed inset-0 z-50 backdrop-blur-[1px]" />
      <D.Content
        className={cn(
          "bg-surface border-border rounded-card fixed top-1/2 left-1/2 z-50 max-h-[90svh] w-[min(520px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-6 shadow-xl",
          className,
        )}
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <D.Title className="text-lg font-semibold">{title}</D.Title>
            {description ? (
              <D.Description className="text-ink-muted mt-1 text-sm">{description}</D.Description>
            ) : null}
          </div>
          <D.Close
            className="text-ink-muted hover:bg-surface-muted hover:text-ink rounded-control -mt-1 -mr-1 p-1.5"
            aria-label="Close"
          >
            <X className="size-4" aria-hidden />
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}
