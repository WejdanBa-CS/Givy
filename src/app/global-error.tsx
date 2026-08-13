"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fef6ee",
          color: "#1a120e",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", margin: 0 }}>Something went wrong</h1>
          <p style={{ color: "#6b5748", marginTop: "0.75rem" }}>
            Please try again. If it keeps happening, refresh the page.
          </p>
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#e8391e",
                color: "#fff",
                border: 0,
                borderRadius: "0.875rem",
                padding: "0.85rem 1.35rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <Link
              href="/"
              style={{
                background: "#fff",
                color: "#1a120e",
                border: "2px solid #e8d9cc",
                borderRadius: "0.875rem",
                padding: "0.85rem 1.35rem",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
