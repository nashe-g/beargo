import { redirect } from "next/navigation";

export default function StartupTermsRedirect() {
  redirect("/terms");
}
