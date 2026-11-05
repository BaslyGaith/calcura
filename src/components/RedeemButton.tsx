"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { redeemOffer } from "@/app/actions/rewards";
import { useT } from "@/lib/i18n/client";

export function RedeemButton({ offerId, cost, balance, stock, loggedIn }: { offerId: string; cost: number; balance: number | null; stock: number; loggedIn: boolean }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!loggedIn) return <button className="btn-secondary btn-sm" onClick={() => router.push("/login")}>{t("rewards.redeem", { n: cost })}</button>;
  if (stock <= 0) return <span className="badge bg-stone-200 text-stone-600">{t("rewards.outOfStock")}</span>;
  const enough = (balance ?? 0) >= cost;
  return (
    <div className="flex flex-col items-start gap-1">
      <button
        className="btn-primary btn-sm"
        disabled={!enough || pending}
        onClick={() =>
          start(async () => {
            const r = await redeemOffer(offerId);
            setMsg(r.ok ? { ok: true, text: t("rewards.success", { code: r.code }) } : { ok: false, text: r.error });
            router.refresh();
          })
        }
      >
        {enough ? t("rewards.redeem", { n: cost }) : t("rewards.notEnough")}
      </button>
      {msg && <span className={`text-xs font-semibold ${msg.ok ? "text-olive-600" : "text-red-600"}`}>{msg.text}</span>}
    </div>
  );
}
