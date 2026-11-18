"use client";

import { ArrowRight, Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useId } from "react";
import { subscribeNewsletter, type NewsletterState } from "@/app/actions/newsletter";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";

const INITIAL: NewsletterState = { status: "idle", message: "" };

export function NewsletterForm({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, INITIAL);
  const id = useId();
  const dark = tone === "dark";

  return (
    <form action={action} className="w-full max-w-md" noValidate>
      <label htmlFor={`${id}-email`} className="sr-only">
        Email address
      </label>
      <div
        className={cn(
          "flex items-center gap-2 border-b pb-2 transition-colors",
          dark
            ? "border-on-strong/40 focus-within:border-on-strong"
            : "border-ink/40 focus-within:border-ink",
        )}
      >
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          aria-invalid={state.status === "error" || undefined}
          aria-describedby={`${id}-msg`}
          className={cn(
            "min-w-0 flex-1 bg-transparent py-2 text-sm outline-none",
            dark ? "placeholder:text-on-strong/60" : "placeholder:text-ink-muted",
          )}
        />
        {/* Honeypot — hidden from people and assistive tech. */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="hidden"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe"
          className="flex size-9 items-center justify-center transition-transform duration-300 hover:translate-x-1"
        >
          {pending ? (
            <Spinner label="Subscribing" />
          ) : state.status === "success" ? (
            <Check className="size-5" aria-hidden />
          ) : (
            <ArrowRight className="size-5" strokeWidth={1.5} aria-hidden />
          )}
        </button>
      </div>
      <div id={`${id}-msg`} aria-live="polite" className="min-h-6 pt-2 text-xs">
        <AnimatePresence mode="wait">
          {state.message ? (
            <motion.p
              key={state.message}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {state.message}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </form>
  );
}
