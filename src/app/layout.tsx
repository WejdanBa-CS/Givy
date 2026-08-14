import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/providers/motion-provider";
import { GivyProvider } from "@/lib/givy-context";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://givy.onrender.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Givy · gifts without the guesswork",
    template: "%s · Givy",
  },
  description:
    "Build a wishlist, share one link, and let friends claim gifts in private. No duplicates, no awkward moments.",
  applicationName: "Givy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Givy",
    title: "Givy · gifts without the guesswork",
    description:
      "Build a wishlist, share one link, and let friends claim gifts in private.",
    images: [
      {
        url: "/givy-hero.jpg",
        width: 1536,
        height: 1024,
        alt: "Givy — a wrapped gift",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Givy · gifts without the guesswork",
    description:
      "Build a wishlist, share one link, and let friends claim gifts in private.",
    images: ["/givy-hero.jpg"],
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          as="image"
          href="/givy-hero.avif"
          type="image/avif"
          fetchPriority="high"
        />
      </head>
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <MotionProvider>
          <GivyProvider>
            {children}
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  background: "#fff",
                  color: "#1a120e",
                  border: "2px solid #e8d9cc",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                },
              }}
            />
          </GivyProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
