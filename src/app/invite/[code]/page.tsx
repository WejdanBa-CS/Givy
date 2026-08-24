import { redirect } from "next/navigation";
import { normalizeInviteCode } from "@/lib/security";

type InviteLinkPageProps = {
  params: Promise<{ code: string }>;
};

export default async function InviteLinkPage({ params }: InviteLinkPageProps) {
  const { code: rawCode } = await params;
  const code = normalizeInviteCode(rawCode);
  redirect(code ? `/invite?code=${encodeURIComponent(code)}` : "/invite");
}
