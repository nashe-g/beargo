import { redirect } from "next/navigation";

export default function StartupRedirect() {
  redirect("/merchant");
}
