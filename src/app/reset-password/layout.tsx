import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset password · Givy",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
