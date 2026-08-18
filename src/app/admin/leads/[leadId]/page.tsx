import { notFound } from "next/navigation";
import { AdminShell, StatusPill } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";
import { getCampaign } from "@/lib/campaign-resolve";
import { CONSENT_VERSION, interestLabel } from "@/lib/campaigns";
import { formatMoney, formatStamp } from "@/lib/format";
import { getHost } from "@/lib/hosts";
import { getPaw } from "@/lib/paws";
import { getStartup } from "@/lib/startups";
import { getLead } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminLeadPage({
  params,
}: PageProps<"/admin/leads/[leadId]">) {
  await requireAdmin();
  const { leadId } = await params;
  const lead = await getLead(leadId);
  if (!lead) notFound();

  const campaign = getCampaign(lead.campaignId);
  const zone = getHost(lead.hostId)?.timezone ?? "America/Chicago";

  return (
    <AdminShell current="/admin/leads">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">{lead.fullName}</h1>
        <StatusPill status={lead.status} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">{lead.id}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Consumer</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Email" value={`${lead.email}${lead.emailVerified ? " · verified" : ""}`} />
            <Row label="Phone" value={lead.phone} />
          </dl>
        </section>
        <section>
          <h2 className="font-display text-2xl">Commercial</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row
              label="Startup"
              value={getStartup(lead.startupId)?.displayName ?? lead.startupId}
            />
            <Row label="Campaign" value={campaign?.name ?? lead.campaignId} />
            <Row label="Interest" value={interestLabel(lead.interestId)} />
            <Row
              label="CPL"
              value={
                lead.grossCpl != null ? formatMoney(lead.grossCpl) : "—"
              }
            />
            <Row
              label="Host share"
              value={
                lead.hostAmount != null ? formatMoney(lead.hostAmount) : "—"
              }
            />
          </dl>
        </section>
        <section>
          <h2 className="font-display text-2xl">Qualification</h2>
          {campaign && Object.keys(lead.qualification).length > 0 ? (
            <dl className="mt-4 space-y-3 text-sm">
              {campaign.questions.map((question) => {
                const selected = question.options.find(
                  (option) => option.id === lead.qualification[question.id],
                );
                return (
                  <Row
                    key={question.id}
                    label={question.prompt}
                    value={selected?.label ?? "—"}
                  />
                );
              })}
            </dl>
          ) : (
            <p className="mt-4 text-ink-soft">Not finished.</p>
          )}
        </section>
        <section>
          <h2 className="font-display text-2xl">Provenance</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row
              label="Host"
              value={getHost(lead.hostId)?.displayName ?? lead.hostId}
            />
            <Row label="Paw" value={lead.pawToken} />
            <Row label="Placement" value={getPaw(lead.pawToken).placementLabel} />
            <Row label="Contact" value={formatStamp(lead.createdAt, zone)} />
            <Row
              label="Verified"
              value={
                lead.emailVerifiedAt
                  ? formatStamp(lead.emailVerifiedAt, zone)
                  : lead.emailVerified
                    ? "Yes"
                    : "No"
              }
            />
            <Row
              label="Finished"
              value={
                lead.qualifiedAt ? formatStamp(lead.qualifiedAt, zone) : "—"
              }
            />
            <Row
              label="Consent"
              value={
                lead.consentAt
                  ? `${lead.consentVersion ?? CONSENT_VERSION} · ${formatStamp(lead.consentAt, zone)}`
                  : "Not yet"
              }
            />
          </dl>
        </section>
      </div>
    </AdminShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 border-b border-ink/10 py-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="max-w-sm text-right">{value}</dd>
    </div>
  );
}
