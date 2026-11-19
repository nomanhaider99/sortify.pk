"use client";

import { BadgeCheck, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useActionState, useId, useState } from "react";
import { submitReview, type ReviewState } from "@/app/actions/review";
import type { ReviewDTO } from "@/app/api/reviews/route";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { Stars } from "./stars";

type Props = {
  productId: string;
  productTitle: string;
  ratingAvg: number;
  ratingCount: number;
  breakdown: { rating: number; count: number }[];
  initial: ReviewDTO[];
};

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/** Rating breakdown, approved reviews (sort + load more) and the write-a-review form. */
export function ReviewsSection({
  productId,
  productTitle,
  ratingAvg,
  ratingCount,
  breakdown,
  initial,
}: Props) {
  const [reviews, setReviews] = useState(initial);
  const [sort, setSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [loading, setLoading] = useState(false);
  const [writing, setWriting] = useState(false);

  const load = async (nextSort: typeof sort, offset: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reviews?productId=${productId}&sort=${nextSort}&offset=${offset}`,
      );
      const data = (await res.json()) as { reviews: ReviewDTO[] };
      setReviews((r) => (offset === 0 ? data.reviews : [...r, ...data.reviews]));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="reviews" className="scroll-mt-28" aria-labelledby="reviews-title">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr] lg:gap-20">
        <div>
          <h2 id="reviews-title" className="font-display text-display-md italic">
            Customer reviews
          </h2>
          {ratingCount ? (
            <>
              <div className="mt-5 flex items-center gap-3">
                <span className="font-display text-5xl italic">{ratingAvg.toFixed(1)}</span>
                <div>
                  <Stars rating={ratingAvg} size={16} />
                  <p className="text-ink-muted mt-1 text-xs">Based on {ratingCount} reviews</p>
                </div>
              </div>
              <ul className="mt-6 space-y-2">
                {breakdown.map((b) => (
                  <li key={b.rating} className="flex items-center gap-3 text-xs">
                    <span className="w-8 tabular-nums">{b.rating} ★</span>
                    <span className="bg-primary-soft h-1.5 flex-1 overflow-hidden rounded-full">
                      <motion.span
                        className="bg-ink block h-full rounded-full"
                        initial={{ width: 0 }}
                        whileInView={{
                          width: `${ratingCount ? (b.count / ratingCount) * 100 : 0}%`,
                        }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </span>
                    <span className="text-ink-muted w-6 text-right tabular-nums">{b.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-ink-muted mt-4 text-sm">
              No reviews yet — be the first to share your thoughts.
            </p>
          )}
          <Button
            variant="secondary"
            className="mt-8"
            onClick={() => setWriting((w) => !w)}
            aria-expanded={writing}
          >
            {writing ? "Close form" : "Write a review"}
          </Button>
        </div>

        <div>
          <AnimatePresence initial={false}>
            {writing ? (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <ReviewForm productId={productId} productTitle={productTitle} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {reviews.length ? (
            <>
              <div className="flex items-center justify-between gap-4">
                <p className="text-ink-muted text-sm">{ratingCount} reviews</p>
                <select
                  value={sort}
                  onChange={(e) => {
                    const s = e.target.value as typeof sort;
                    setSort(s);
                    void load(s, 0);
                  }}
                  aria-label="Sort reviews"
                  className="border-border h-9 rounded-full border bg-transparent px-3 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="highest">Highest rated</option>
                  <option value="lowest">Lowest rated</option>
                </select>
              </div>
              <ul className="divide-border mt-4 divide-y">
                {reviews.map((r) => (
                  <li key={r.id} className="py-7">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Stars rating={r.rating} />
                      <p className="text-sm font-medium">{r.title}</p>
                    </div>
                    <p className="text-ink-muted mt-3 text-sm leading-relaxed">{r.body}</p>
                    <p className="text-ink-muted mt-4 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-ink font-medium">{r.customerName}</span>
                      {r.isVerifiedPurchase ? (
                        <span className="text-primary-strong inline-flex items-center gap-1">
                          <BadgeCheck className="size-3.5" aria-hidden /> Verified purchase
                        </span>
                      ) : null}
                      <span aria-hidden>·</span>
                      <time dateTime={r.createdAt}>{dateFmt.format(new Date(r.createdAt))}</time>
                    </p>
                    {r.ownerReply ? (
                      <div className="bg-surface-muted mt-4 rounded-xs p-4 text-sm">
                        <p className="text-xs font-medium tracking-[0.08em] uppercase">
                          Reply from the team
                        </p>
                        <p className="text-ink-muted mt-1.5">{r.ownerReply}</p>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
              {reviews.length < ratingCount ? (
                <Button
                  variant="secondary"
                  disabled={loading}
                  onClick={() => void load(sort, reviews.length)}
                  className="mt-4"
                >
                  {loading ? <Spinner label="Loading reviews" /> : "Show more reviews"}
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

const INITIAL: ReviewState = { status: "idle", message: "" };

function ReviewForm({ productId, productTitle }: { productId: string; productTitle: string }) {
  const [state, action, pending] = useActionState(submitReview, INITIAL);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const id = useId();
  const err = state.fieldErrors ?? {};

  if (state.status === "success") {
    return (
      <div className="bg-primary-soft mb-10 rounded-sm p-8 text-center" role="status">
        <p className="font-display text-2xl italic">Thank you!</p>
        <p className="text-ink-muted mt-2 text-sm">{state.message}</p>
      </div>
    );
  }

  const field =
    "border-border bg-surface focus-visible:outline-primary-strong w-full rounded-xs border px-4 py-3 text-sm aria-invalid:border-danger";

  return (
    <form
      action={action}
      className="bg-surface border-border mb-10 grid gap-5 rounded-sm border p-6 md:p-8"
      noValidate
    >
      <p className="font-display text-2xl italic">Review “{productTitle}”</p>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <fieldset>
        <legend className="mb-2 text-sm">Your rating</legend>
        <div
          className="flex gap-1"
          role="radiogroup"
          aria-label="Rating"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  (hover || rating) >= n ? "fill-ink text-ink" : "text-border",
                )}
                strokeWidth={1.25}
              />
            </button>
          ))}
        </div>
        {err.rating ? <p className="text-danger mt-1.5 text-xs">{err.rating}</p> : null}
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm">
            Name
          </label>
          <input
            id={`${id}-name`}
            name="name"
            autoComplete="name"
            className={field}
            aria-invalid={Boolean(err.name) || undefined}
          />
          {err.name ? <p className="text-danger mt-1.5 text-xs">{err.name}</p> : null}
        </div>
        <div>
          <label htmlFor={`${id}-email`} className="mb-1.5 block text-sm">
            Email <span className="text-ink-muted">(never shown)</span>
          </label>
          <input
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            className={field}
            aria-invalid={Boolean(err.email) || undefined}
          />
          {err.email ? <p className="text-danger mt-1.5 text-xs">{err.email}</p> : null}
        </div>
      </div>
      <div>
        <label htmlFor={`${id}-title`} className="mb-1.5 block text-sm">
          Review title
        </label>
        <input
          id={`${id}-title`}
          name="title"
          className={field}
          aria-invalid={Boolean(err.title) || undefined}
        />
        {err.title ? <p className="text-danger mt-1.5 text-xs">{err.title}</p> : null}
      </div>
      <div>
        <label htmlFor={`${id}-body`} className="mb-1.5 block text-sm">
          Your review
        </label>
        <textarea
          id={`${id}-body`}
          name="body"
          rows={5}
          className={field}
          aria-invalid={Boolean(err.body) || undefined}
        />
        {err.body ? <p className="text-danger mt-1.5 text-xs">{err.body}</p> : null}
      </div>
      {state.status === "error" ? (
        <p className="text-danger text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? <Spinner label="Submitting" /> : "Submit review"}
        </Button>
        <p className="text-ink-muted mt-3 text-xs">
          Reviews are checked by our team before they’re published.
        </p>
      </div>
    </form>
  );
}
