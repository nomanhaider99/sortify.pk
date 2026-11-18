"use client";

import { X } from "lucide-react";
import { Fragment } from "react";
import { Marquee } from "@/components/motion/marquee";

export const ANNOUNCEMENT_HEIGHT = 32;

type AnnouncementBarProps = {
  messages: readonly string[];
  dismissible: boolean;
  onDismiss: () => void;
};

/** Thin dark marquee bar above the header (ref-3). Messages come from admin Settings. */
export function AnnouncementBar({ messages, dismissible, onDismiss }: AnnouncementBarProps) {
  // Repeat short lists so one track is always wider than the viewport.
  const items = messages.length < 4 ? [...messages, ...messages] : messages;
  return (
    <div
      className="bg-menu-bg text-on-strong relative flex items-center text-[0.8125rem]"
      style={{ height: ANNOUNCEMENT_HEIGHT }}
    >
      <Marquee
        duration={Math.max(24, items.length * 9)}
        label="Store announcements"
        className="flex-1"
      >
        {items.map((m, i) => (
          <Fragment key={`${m}-${i}`}>
            <span className="px-12 whitespace-nowrap">{m}</span>
          </Fragment>
        ))}
      </Marquee>
      {dismissible ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss announcements"
          className="bg-menu-bg absolute right-0 flex h-full w-9 items-center justify-center opacity-80 transition-opacity hover:opacity-100"
        >
          <X className="size-3.5" strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
