import { redirect } from "next/navigation";

export default function LegacyCreateRedirect() {
  redirect("/app/create");
}
