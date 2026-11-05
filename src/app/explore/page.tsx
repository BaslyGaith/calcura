import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { FEATURES, mapPoints, searchVenues, type VenueFilters } from "@/lib/venues";
import { VenueCard } from "@/components/VenueCard";
import { LocationButton } from "@/components/LocationButton";
import { VenueMapLazy } from "@/components/VenueMapLazy";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

type SP = Record<string, string | undefined>;

function num(v: string | undefined) {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ExplorePage({ searchParams }: { searchParams: SP }) {
  const { t, locale } = getT();
  const sortParam = searchParams.sort;
  const filters: VenueFilters = {
    q: searchParams.q || undefined,
    type: searchParams.type || undefined,
    gov: searchParams.gov || undefined,
    price: num(searchParams.price),
    feature: searchParams.feature || undefined,
    lat: num(searchParams.lat),
    lng: num(searchParams.lng),
    page: num(searchParams.page),
    sort: sortParam === "distance" || sortParam === "rating" || sortParam === "name" || sortParam === "recent" || sortParam === "popular" ? sortParam : undefined,
  };
  const view = searchParams.view === "map" ? "map" : "list";
  const governorates = await prisma.governorate.findMany({ orderBy: { nameFr: "asc" } });
  const userPos: [number, number] | null = filters.lat !== undefined && filters.lng !== undefined ? [filters.lat, filters.lng] : null;
  const gov = governorates.find((g) => g.slug === filters.gov);

  const link = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...searchParams, ...patch })) if (v) p.set(k, v);
    return `/explore?${p.toString()}`;
  };

  const list = view === "list" ? await searchVenues(filters) : null;
  const points = view === "map" ? await mapPoints(filters) : [];

  return (
    <div className="container-bp py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">{gov ? (locale === "en" ? gov.nameEn : gov.nameFr) : t("explore.title")}</h1>
        <div className="flex gap-2">
          <LocationButton />
          <div className="flex overflow-hidden rounded-xl border border-stone-300 text-sm font-semibold">
            <Link href={link({ view: undefined })} className={`px-3 py-2 ${view === "list" ? "bg-brand-500 text-white" : "bg-white"}`}>☰ {t("explore.listView")}</Link>
            <Link href={link({ view: "map", page: undefined })} className={`px-3 py-2 ${view === "map" ? "bg-brand-500 text-white" : "bg-white"}`}>🗺️ {t("explore.mapView")}</Link>
          </div>
        </div>
      </div>

      <form className="card mb-6 grid grid-cols-2 gap-3 p-4 md:grid-cols-6" action="/explore">
        {view === "map" && <input type="hidden" name="view" value="map" />}
        {userPos && (<><input type="hidden" name="lat" value={filters.lat} /><input type="hidden" name="lng" value={filters.lng} /></>)}
        <input name="q" defaultValue={filters.q} placeholder={t("home.searchPlaceholder")} className="input col-span-2" />
        <select name="type" defaultValue={filters.type ?? ""} className="input">
          <option value="">{t("common.all")}</option>
          <option value="CAFE">{t("common.cafes")}</option>
          <option value="RESTAURANT">{t("common.restaurants")}</option>
        </select>
        <select name="gov" defaultValue={filters.gov ?? ""} className="input">
          <option value="">{t("common.governorate")} — {t("common.all")}</option>
          {governorates.map((g) => <option key={g.id} value={g.slug}>{locale === "en" ? g.nameEn : g.nameFr}</option>)}
        </select>
        <select name="price" defaultValue={filters.price ?? ""} className="input">
          <option value="">{t("explore.price")}</option>
          {[1, 2, 3, 4].map((p) => <option key={p} value={p}>{"DT".repeat(p)}</option>)}
        </select>
        <select name="feature" defaultValue={filters.feature ?? ""} className="input">
          <option value="">{t("explore.feature")}</option>
          {FEATURES.map((f) => <option key={f} value={f}>{t(`feature.${f}` as DictKey)}</option>)}
        </select>
        {view === "list" && (
          <select name="sort" defaultValue={filters.sort ?? ""} className="input">
            <option value="">{t("explore.sort")}</option>
            {userPos && <option value="distance">{t("explore.sort.distance")}</option>}
            <option value="popular">{t("explore.sort.popular")}</option>
            <option value="rating">{t("explore.sort.rating")}</option>
            <option value="name">{t("explore.sort.name")}</option>
            <option value="recent">{t("explore.sort.recent")}</option>
          </select>
        )}
        <button className="btn-primary col-span-2 md:col-span-1">{t("common.search")}</button>
      </form>

      {view === "map" ? (
        <VenueMapLazy
          points={points}
          user={userPos}
          center={userPos ?? (gov ? [gov.lat, gov.lng] : undefined)}
          zoom={userPos ? 14 : gov ? 11 : 7}
          height="70vh"
        />
      ) : list && list.items.length === 0 ? (
        <p className="card p-8 text-center text-stone-500">{t("explore.noResults")}</p>
      ) : list ? (
        <>
          <p className="mb-3 text-sm text-stone-500">{t("explore.results", { n: list.total })}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {list.items.map((v) => <VenueCard key={v.id} v={v} t={t} locale={locale} />)}
          </div>
          {list.pages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3 text-sm">
              {list.page > 1 && <Link className="btn-secondary" href={link({ page: String(list.page - 1) })}>← {t("explore.prev")}</Link>}
              <span>{list.page} / {list.pages}</span>
              {list.page < list.pages && <Link className="btn-secondary" href={link({ page: String(list.page + 1) })}>{t("explore.next")} →</Link>}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
