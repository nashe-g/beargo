import { notFound } from "next/navigation";
import { StartupShell, StatusPill } from "@/components/startup/StartupShell";
import {
  CONSENT_VERSION,
  interestLabel,
} from "@/lib/campaigns";
import { getCampaign } from "@/lib/campaign-resolve";
import { formatMoney, formatStamp } from "@/lib/format";
import { requireStartup } from "@/lib/startup-auth";
import {
  canRevealContact,
  hostNameForLead,
  placementForLead,
} from "@/lib/startup-stats";
import { getLead } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function StartupLeadPage({
  params,
}: PageProps<"/startup/leads/[leadId]">) {
  const startup = await requireStartup();
  const { leadId } = await params;
  const lead = await getLead(leadId);
  if (!lead || lead.startupId !== startup.id) notFound();

  const campaign = await getCampaign(lead.campaignId);
  const revealed = canRevealContact(lead);
  const zone = "America/Chicago";
  const hostName = await hostNameForLead(lead);
  const placement = await placementForLead(lead);

  return (
    <StartupShell startup={startup} current="/startup/leads">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-4xl">
          {revealed ? lead.fullName : "Introduction in progress"}
        </h1>
        <StatusPill status={lead.status} />
      </div>
      <p className="mt-2 text-sm text-ink-soft">{lead.id}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Consumer</h2>
          {revealed ? (
            <dl className="mt-4 space-y-3 text-sm">
              <Row label="Name" value={lead.fullName} />
              <Row
                label="Email"
                value={`${lead.email}${lead.emailVerified ? " · verified" : ""}`}
              />
              <Row label="Phone" value={`${lead.phone} · not verified`} />
            </dl>
          ) : (
            <p className="mt-4 text-ink-soft">
              Hidden until this introduction qualifies. Consent is given at
              finish.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl">Sponsor intent</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Campaign" value={campaign?.name ?? lead.campaignId} />
            <Row label="Interest" value={interestLabel(lead.interestId)} />
            <Row
              label="Started"
              value={formatStamp(lead.createdAt, zone)}
            />
          </dl>
        </section>

        <section>
          <h2 className="font-display text-2xl">Qualification</h2>
          {revealed && campaign ? (
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
              <Row label="Pass" value="Qualified" />
              <Row
                label="CPL"
                value={formatMoney(lead.grossCpl ?? campaign.grossCpl)}
              />
            </dl>
          ) : (
            <p className="mt-4 text-ink-soft">Not finished.</p>
          )}
        </section>

        <section>
          <h2 className="font-display text-2xl">Physical provenance</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Host" value={hostName} />
            <Row label="Paw" value={lead.pawToken} />
            <Row label="Placement" value={placement} />
            <Row
              label="Contact submitted"
              value={formatStamp(lead.createdAt, zone)}
            />
            <Row
              label="Email verified"
              value={
                lead.emailVerifiedAt
                  ? formatStamp(lead.emailVerifiedAt, zone)
                  : lead.emailVerified
                    ? "Yes"
                    : "No"
              }
            />
            <Row
              label="Introduction finished"
              value={
                lead.qualifiedAt ? formatStamp(lead.qualifiedAt, zone) : "—"
              }
            />
          </dl>
        </section>

        <section className="lg:col-span-2">
          <h2 className="font-display text-2xl">Consent</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row
              label="Status"
              value={lead.consentAt ? "Given" : "Not yet"}
            />
            <Row
              label="Version"
              value={lead.consentVersion ?? CONSENT_VERSION}
            />
            <Row
              label="When"
              value={lead.consentAt ? formatStamp(lead.consentAt, zone) : "—"}
            />
            <Row
              label="Fields"
              value="Name, email, phone, qualification responses"
            />
            <Row
              label="Purpose"
              value={`Follow-up about ${campaign?.name ?? startup.displayName}`}
            />
          </dl>
        </section>
      </div>
    </StartupShell>
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
