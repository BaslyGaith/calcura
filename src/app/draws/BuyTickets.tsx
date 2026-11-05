"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buyTickets } from "@/app/actions/draws";
import { useT } from "@/lib/i18n/client";

export function BuyTickets({ drawId, cost, balance }: { drawId: string; cost: number; balance: number }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        type="button"
        className="btn-secondary btn-sm"
        disabled={pending || balance < cost}
        onClick={() => start(async () => {
          const r = await buyTickets(drawId, 1);
          setError(r.ok ? null : r.error);
          router.refresh();
        })}
      >
        {balance < cost ? t("rewards.notEnough") : t("draws.buy", { n: 1, c: cost })}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
