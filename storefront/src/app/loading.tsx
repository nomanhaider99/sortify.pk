import { Container } from "@/components/ui/container";

/** Route-level loading state: a quiet skeleton in the shape of a listing page. */
export default function Loading() {
  return (
    <Container className="py-section" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="bg-surface-muted mx-auto h-10 w-64 animate-pulse rounded-xs" />
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="bg-surface-muted aspect-[4/5] animate-pulse rounded-xs" />
            <div className="bg-surface-muted mt-3 h-3 w-16 animate-pulse rounded-xs" />
            <div className="bg-surface-muted mt-2 h-4 w-40 animate-pulse rounded-xs" />
          </div>
        ))}
      </div>
    </Container>
  );
}
