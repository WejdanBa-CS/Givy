import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Beta · Givy",
  description: "Redeem an invite to join the Givy beta.",
  robots: { index: false, follow: false },
};

export default function InviteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
