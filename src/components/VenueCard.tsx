import Link from "next/link";
import type { VenueListItem } from "@/lib/venues";
import { formatDistance } from "@/lib/geo";
import { Stars } from "./Stars";
import type { T } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/dictionaries";

export function VenueCard({ v, t, locale }: { v: VenueListItem; t: T; locale: Locale }) {
  const gov = locale === "en" ? v.governorate.nameEn : v.governorate.nameFr;
  return (
    <Link href={`/venues/${v.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-orange-100 to-amber-50">
        {v.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.image} alt={v.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-5xl">{v.type === "CAFE" ? "☕" : "🍽️"}</div>
        )}
        <span className={`badge absolute left-2 top-2 ${v.type === "CAFE" ? "bg-amber-800 text-white" : "bg-brand-600 text-white"}`}>
          {v.type === "CAFE" ? t("common.cafe") : t("common.restaurant")}
        </span>
        {v._count.offers > 0 && <span className="badge absolute right-2 top-2 bg-olive-500 text-white">🎁 {v._count.offers}</span>}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 font-bold group-hover:text-brand-600">{v.name}</h3>
        <p className="line-clamp-1 text-xs text-stone-500">
          {[v.city, gov].filter(Boolean).join(" · ")}
          {v.cuisine ? ` · ${v.cuisine}` : ""}
        </p>
        <div className="mt-auto flex items-center justify-between pt-1 text-xs">
          <span className="flex items-center gap-1">
            {v.rating !== null ? (<><Stars value={v.rating} size="text-xs" /> <span className="text-stone-500">({v.reviewCount})</span></>) : <span className="text-stone-400">—</span>}
          </span>
          <span className="flex items-center gap-2 text-stone-500">
            <span>{"DT".repeat(v.priceLevel)}</span>
            {v.distance !== null && <span className="font-semibold text-brand-600">{formatDistance(v.distance)}</span>}
          </span>
        </div>
      </div>
    </Link>
  );
}
