import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendar · Givy",
  description: "Personal occasions and friends' upcoming events on Givy.",
  robots: { index: false, follow: false },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
