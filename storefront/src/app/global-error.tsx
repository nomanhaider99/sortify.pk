"use client";

/** Last-resort boundary when the root layout itself fails (renders its own <html>). */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "grid",
          placeItems: "center",
          background: "#F7F5EF",
          color: "#1F2A1A",
          fontFamily: "Georgia, serif",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontStyle: "italic", fontWeight: 400, fontSize: "2.5rem" }}>
            Something went wrong
          </h1>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "12px 24px",
              background: "#4F6B3F",
              color: "#F7F5EF",
              border: 0,
              borderRadius: 2,
              cursor: "pointer",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
