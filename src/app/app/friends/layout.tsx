import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Friends · Givy",
  description: "Find friends and manage friend requests on Givy.",
  robots: { index: false, follow: false },
};

export default function FriendsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
