import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update required",
  robots: { index: false, follow: false },
};

const STORE_URL =
  "https://play.google.com/store/apps/details?id=com.givy.givy";

/** Shown inside the Play WebView when the installed shell is below min version. */
export default function UpdateRequiredPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "48px 24px",
        display: "grid",
        placeItems: "center",
        background: "#FEF6EE",
        color: "#1a1a1a",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 420 }}>
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#E8391E",
          }}
        >
          Givy
        </p>
        <h1 style={{ margin: "0 0 12px", fontSize: 28, lineHeight: 1.2 }}>
          Update required
        </h1>
        <p style={{ margin: "0 0 28px", fontSize: 16, lineHeight: 1.5, opacity: 0.72 }}>
          This version of the Givy app is no longer supported. Update from Google
          Play to keep signing in and managing your lists.
        </p>
        <a
          href={STORE_URL}
          style={{
            display: "inline-block",
            padding: "14px 22px",
            borderRadius: 999,
            background: "#E8391E",
            color: "#fff",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Update on Google Play
        </a>
      </div>
    </main>
  );
}
