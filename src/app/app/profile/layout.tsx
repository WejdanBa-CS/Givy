import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile · Givy",
  description: "Manage your Givy profile and account preferences.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
