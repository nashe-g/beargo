"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CardMenu } from "@/components/ui/CardMenu";
import {
  canCancelPromotion,
  promotionStatusLabel,
  redemptionLimitLabel,
  type PromotionStatus,
} from "@/lib/offer";

export type ManageOfferCard = {
  id: string;
  status: PromotionStatus;
  title: string;
  subtitle: string;
  detail?: string;
  shortTerms?: string | null;
  maxRedemptions: number | null;
  remaining: number | null;
  testMode: boolean;
};

export function OfferManageList({
  offers,
  role,
}: {
  offers: ManageOfferCard[];
  role: "admin" | "merchant";
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [canceled, setCanceled] = useState<string[]>([]);

  async function cancel(id: string) {
    setBusyId(id);
    setMessage("");
    const path =
      role === "admin"
        ? `/api/admin/promotions/${id}/cancel`
        : `/api/merchant/promotions/${id}/cancel`;
    const response = await fetch(path, { method: "POST" });
    if (!response.ok) {
      setMessage("Could not cancel this offer.");
      setBusyId("");
      return;
    }
    setCanceled((ids) => [...ids, id]);
    setBusyId("");
    router.refresh();
  }

  if (offers.length === 0) {
    return <p className="mt-4 text-ink-soft">No offers yet.</p>;
  }

  return (
    <div>
      <ul className="mt-4 space-y-4">
        {offers.map((offer) => {
          const status = canceled.includes(offer.id)
            ? "cancelled"
            : offer.status;
          const live = status === "live";
          return (
            <li
              key={offer.id}
              className="relative rounded-3xl border border-ink/10 px-5 py-5"
            >
              {canCancelPromotion(status) ? (
                <CardMenu
                  label="Offer actions"
                  disabled={busyId === offer.id}
                  items={[
                    {
                      label: "Cancel this offer",
                      onClick: () => cancel(offer.id),
                    },
                  ]}
                />
              ) : null}
              <p className="pr-12 text-sm">
                <span
                  className={`rounded-full px-3 py-1 ${
                    live ? "bg-moss text-paper" : "bg-ink/10 text-ink-soft"
                  }`}
                >
                  {promotionStatusLabel(status)}
                </span>
              </p>
              <h2 className="mt-3 font-display text-3xl">{offer.title}</h2>
              <p className="mt-2 text-ink-soft">{offer.subtitle}</p>
              {offer.detail ? (
                <p className="mt-1 text-sm text-ink-soft">{offer.detail}</p>
              ) : null}
              <p className="mt-2 text-sm text-ink-soft">
                {redemptionLimitLabel(offer.maxRedemptions, offer.remaining)}
                {offer.testMode ? " · test (no $1 fee)" : ""}
              </p>
              {offer.shortTerms ? (
                <p className="mt-3">{offer.shortTerms}</p>
              ) : null}
            </li>
          );
        })}
      </ul>
      {message ? <p className="mt-3 text-sm text-clay">{message}</p> : null}
    </div>
  );
}
