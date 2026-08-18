import { Suspense } from "react";
import { OpsUnlock } from "@/components/ops/OpsUnlock";

export default function OpsPage() {
  return (
    <Suspense>
      <OpsUnlock />
    </Suspense>
  );
}
