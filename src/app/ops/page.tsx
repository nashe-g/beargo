import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OpsUnlock } from "@/components/ops/OpsUnlock";
import { StaffHome } from "@/components/ops/StaffHome";
import {
  OPS_COOKIE,
  isOpsUnlocked,
  staffDestination,
} from "@/lib/ops-gate";

export const dynamic = "force-dynamic";

export default async function OpsPage({
  searchParams,
}: PageProps<"/ops">) {
  const query = await searchParams;
  const raw = Array.isArray(query.next) ? query.next[0] : query.next ?? null;
  const dest = staffDestination(raw);
  const unlocked = await isOpsUnlocked(
    (await cookies()).get(OPS_COOKIE)?.value,
  );

  if (unlocked && dest) redirect(dest);
  if (unlocked) return <StaffHome />;

  return (
    <Suspense>
      <OpsUnlock />
    </Suspense>
  );
}
