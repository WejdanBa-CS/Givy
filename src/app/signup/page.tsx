import type { Metadata } from "next";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a Givy account, share one wishlist link, and let friends claim gifts privately.",
};

export default function SignupPage() {
  return <AuthScreen />;
}
