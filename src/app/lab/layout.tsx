import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { isProduction } from "@/lib/auth";

export default function LabLayout({ children }: { children: ReactNode }) {
  if (isProduction()) notFound();
  return children;
}
