import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import { Toaster } from "sonner";
import { MotionProvider } from "@/components/providers/motion-provider";
import { Skimlinks } from "@/components/Skimlinks";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FEF6EE",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Givy · One list. Zero awkward duplicates.",
    template: "%s · Givy",
  },
  description:
    "Create one list, share one link, and let friends claim gifts privately — so nobody buys the same gift twice.",
  applicationName: "Givy",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Givy",
    title: "Givy · One list. Zero awkward duplicates.",
    description:
      "Create one list, share one link, and let friends claim gifts privately — so nobody buys the same gift twice.",
    images: [
      {
        url: "/givy-hero.jpg",
        width: 1536,
        height: 1024,
        alt: "A wrapped cream gift tied with a ribbon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Givy · One list. Zero awkward duplicates.",
    description:
      "Create one list, share one link, and let friends claim gifts privately — so nobody buys the same gift twice.",
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
            <Skimlinks />
          </GivyProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
