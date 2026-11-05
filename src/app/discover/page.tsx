import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { searchVenues, visibleVenueWhere } from "@/lib/venues";
import { VenueCard } from "@/components/VenueCard";
import { LocationButton } from "@/components/LocationButton";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const { t, locale } = getT();
  // Le tri par défaut place les établissements « à la une » en premier.
  const [governorates, counts, featured] = await Promise.all([
    prisma.governorate.findMany({ orderBy: { code: "asc" } }),
    prisma.venue.groupBy({ by: ["governorateId"], where: visibleVenueWhere, _count: { _all: true } }),
    searchVenues({ perPage: 8, sort: "recent" }),
  ]);
  const countBy = new Map(counts.map((c) => [c.governorateId, c._count._all]));
  const featuredList = featured.items;

  return (
    <>
      <section className="bg-gradient-to-br from-brand-500 via-brand-400 to-amber-400 text-white">
        <div className="container-bp py-12 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{t("home.hero.title")}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/90">{t("home.hero.subtitle")}</p>
          <form action="/explore" className="mt-6 flex max-w-2xl flex-col gap-2 sm:flex-row">
            <input name="q" placeholder={t("home.searchPlaceholder")} className="input flex-1 border-0 py-3 text-base text-stone-800" />
            <button className="btn bg-stone-900 px-6 py-3 text-white hover:bg-stone-800">{t("common.search")}</button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            <LocationButton target="/explore" className="btn bg-white/95 text-brand-700 hover:bg-white" />
            <Link href="/explore?type=CAFE" className="btn bg-white/20 text-white hover:bg-white/30">☕ {t("common.cafes")}</Link>
            <Link href="/explore?type=RESTAURANT" className="btn bg-white/20 text-white hover:bg-white/30">🍽️ {t("common.restaurants")}</Link>
          </div>
        </div>
      </section>

      <section className="container-bp py-10">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="h2">{t("home.featured")}</h2>
          <Link href="/explore" className="text-sm font-semibold text-brand-600">{t("common.seeAll")} →</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredList.map((v) => <VenueCard key={v.id} v={v} t={t} locale={locale} />)}
        </div>
      </section>

      <section className="container-bp py-4">
        <h2 className="h2 mb-4">{t("home.governorates")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {governorates.map((g) => (
            <Link key={g.id} href={`/explore?gov=${g.slug}`} className="card p-3 transition hover:border-brand-300 hover:bg-brand-50">
              <div className="font-semibold">{locale === "en" ? g.nameEn : g.nameFr}</div>
              <div className="text-xs text-stone-500" dir="rtl">{g.nameAr}</div>
              <div className="mt-1 text-xs font-medium text-brand-600">{t("home.venuesCount", { n: countBy.get(g.id) ?? 0 })}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-bp grid gap-4 py-10 md:grid-cols-2">
        <div className="card bg-gradient-to-br from-amber-50 to-orange-100 p-6">
          <div className="text-4xl">🎮</div>
          <h2 className="h2 mt-2">{t("home.playTitle")}</h2>
          <p className="mt-2 text-stone-600">{t("home.playText")}</p>
          <Link href="/games" className="btn-primary mt-4">{t("home.playCta")}</Link>
        </div>
        <div className="card bg-gradient-to-br from-lime-50 to-emerald-50 p-6">
          <div className="text-4xl">🏪</div>
          <h2 className="h2 mt-2">{t("home.merchantTitle")}</h2>
          <p className="mt-2 text-stone-600">{t("home.merchantText")}</p>
          <Link href="/register?role=merchant" className="btn-success mt-4">{t("home.merchantCta")}</Link>
        </div>
      </section>
    </>
  );
}
