import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity · Givy",
  description: "Review gift-list activity and private claim updates.",
};

export default function ActivityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
