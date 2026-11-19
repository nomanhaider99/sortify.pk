"use client";

import { motion } from "motion/react";
import { useActionState, useId } from "react";
import { sendContactMessage, type ContactState } from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const INITIAL: ContactState = { status: "idle", message: "" };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendContactMessage, INITIAL);
  const id = useId();
  const err = state.fieldErrors ?? {};
  const field =
    "border-border bg-surface focus-visible:outline-primary-strong w-full rounded-xs border px-4 py-3.5 text-sm aria-invalid:border-danger";

  if (state.status === "success") {
    return (
      <motion.div
        className="bg-surface border-border flex flex-col items-center rounded-sm border px-8 py-16 text-center"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        role="status"
      >
        <svg viewBox="0 0 52 52" className="text-primary-strong size-16" aria-hidden>
          <motion.circle
            cx="26"
            cy="26"
            r="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.7 }}
          />
          <motion.path
            d="M15 27l7 7 15-16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          />
        </svg>
        <p className="font-display mt-6 text-3xl italic">Message sent</p>
        <p className="text-ink-muted mt-3 max-w-sm text-sm">{state.message}</p>
      </motion.div>
    );
  }

  const error = (name: keyof NonNullable<ContactState["fieldErrors"]>) =>
    err[name] ? (
      <p id={`${id}-${name}-err`} className="text-danger mt-1.5 text-xs">
        {err[name]}
      </p>
    ) : null;
  const a11y = (name: keyof NonNullable<ContactState["fieldErrors"]>) => ({
    "aria-invalid": Boolean(err[name]) || undefined,
    "aria-describedby": err[name] ? `${id}-${name}-err` : undefined,
  });

  return (
    <form action={action} noValidate className="grid gap-5">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm">
            Name
          </label>
          <input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            required
            className={field}
            {...a11y("name")}
          />
          {error("name")}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-sm">
            Email
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            className={field}
            {...a11y("email")}
          />
          {error("email")}
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-phone`} className="mb-1.5 block text-sm">
            Phone <span className="text-ink-muted">(optional)</span>
          </label>
          <input
            id={`${id}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            className={field}
            {...a11y("phone")}
          />
          {error("phone")}
        </div>
        <div>
          <label htmlFor={`${id}-subject`} className="mb-1.5 block text-sm">
            Subject
          </label>
          <input
            id={`${id}-subject`}
            name="subject"
            required
            className={field}
            {...a11y("subject")}
          />
          {error("subject")}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="mb-1.5 block text-sm">
          Message
        </label>
        <textarea
          id={`${id}-message`}
          name="message"
          rows={6}
          required
          className={field}
          {...a11y("message")}
        />
        {error("message")}
      </div>
      {state.status === "error" ? (
        <p role="alert" className="text-danger text-sm">
          {state.message}
        </p>
      ) : null}
      <div>
        <Button type="submit" size="lg" disabled={pending} className="min-w-44">
          {pending ? <Spinner label="Sending" /> : "Send message"}
        </Button>
      </div>
    </form>
  );
}
