"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFavorite } from "@/app/actions/venue";
import { useT } from "@/lib/i18n/client";

export function VenueActions({ venueId, isFavorite, loggedIn, phone, lat, lng }: { venueId: string; isFavorite: boolean; loggedIn: boolean; phone: string | null; lat: number; lng: number }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ url }); } catch { /* annulé */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a className="btn bg-sky-500 text-white hover:bg-sky-600" target="_blank" rel="noreferrer" href={`https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`}>🚗 {t("venue.waze")}</a>
      <a className="btn-primary" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}>🧭 {t("venue.directions")}</a>
      {phone && <a className="btn-secondary" href={`tel:${phone.replace(/\s/g, "")}`}>📞 {t("venue.call")}</a>}
      <button
        type="button"
        className="btn-secondary"
        disabled={pending}
        onClick={() => (loggedIn ? start(() => toggleFavorite(venueId)) : router.push("/login"))}
      >
        {isFavorite ? "❤️ " + t("venue.unfavorite") : "🤍 " + t("venue.favorite")}
      </button>
      <button type="button" className="btn-secondary" onClick={share}>🔗 {copied ? t("venue.shared") : t("venue.share")}</button>
    </div>
  );
}
