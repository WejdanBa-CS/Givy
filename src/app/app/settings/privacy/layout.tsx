import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy settings · Givy",
  description: "Control who sees your calendar and wishlists on Givy.",
  robots: { index: false, follow: false },
};

export default function PrivacySettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
