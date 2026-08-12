import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Givy — gifts without the guesswork",
  description:
    "Build a wishlist, share one link, and let friends claim gifts in private — no duplicates, no awkward moments.",
  applicationName: "Givy",
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
      <body className={`${display.variable} ${body.variable} antialiased`}>
        <GivyProvider>{children}</GivyProvider>
      </body>
    </html>
  );
}
