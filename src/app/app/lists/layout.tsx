import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Lists · Givy",
  description: "Manage your private Givy gift lists.",
};

export default function ListsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
