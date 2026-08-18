import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { listApplications } from "@/lib/applications";
import { ApplicationsQueue } from "@/components/admin/ApplicationsQueue";

export const dynamic = "force-dynamic";

export default async function AdminApplicationsPage() {
  await requireAdmin();
  const pending = await listApplications("pending");
  return (
    <AdminShell current="/admin/applications">
      <h1 className="font-display text-4xl">Applications</h1>
      <p className="mt-3 text-ink-soft">
        Host and startup apply from the public site. Approve to create a record
        and a magic-link login.
      </p>
      {pending.length === 0 ? (
        <p className="mt-8 text-ink-soft">None pending.</p>
      ) : (
        <ApplicationsQueue applications={pending} />
      )}
      <p className="mt-8 text-sm text-ink-soft">
        <StatusPill status="pending" /> shows in the queue until you act.
      </p>
    </AdminShell>
  );
}
