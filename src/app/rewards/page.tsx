import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { visibleVenueWhere } from "@/lib/venues";
import { RedeemButton } from "@/components/RedeemButton";

export const dynamic = "force-dynamic";

export default async function RewardsPage({ searchParams }: { searchParams: { gov?: string } }) {
  const { t, locale } = getT();
  const user = await getCurrentUser();
  const governorates = await prisma.governorate.findMany({ orderBy: { nameFr: "asc" } });
  const offers = await prisma.offer.findMany({
    where: {
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      venue: { AND: [visibleVenueWhere, searchParams.gov ? { governorate: { slug: searchParams.gov } } : {}] },
    },
    include: { venue: { include: { governorate: true } } },
    orderBy: { pointsCost: "asc" },
    take: 200,
  });

  return (
    <div className="container-bp py-8">
      <h1 className="h1">🎁 {t("rewards.title")}</h1>
      <p className="mt-1 text-stone-600">{t("rewards.subtitle")}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {user && <span className="rounded-xl bg-amber-100 px-3 py-1 font-semibold text-amber-900">⭐ {t("rewards.balance", { n: user.points })}</span>}
        <form className="flex gap-2">
          <select name="gov" defaultValue={searchParams.gov ?? ""} className="input">
            <option value="">{t("common.governorate")} — {t("common.all")}</option>
            {governorates.map((g) => <option key={g.id} value={g.slug}>{locale === "en" ? g.nameEn : g.nameFr}</option>)}
          </select>
          <button className="btn-secondary">{t("common.search")}</button>
        </form>
      </div>
      {offers.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-stone-500">{t("common.none")}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => (
            <div key={o.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold">{o.title}</h2>
                <span className="badge whitespace-nowrap bg-amber-100 text-amber-900">⭐ {o.pointsCost}</span>
              </div>
              <Link href={`/venues/${o.venueId}`} className="text-sm text-brand-600 hover:underline">
                {t("rewards.at", { venue: o.venue.name })} · {locale === "en" ? o.venue.governorate.nameEn : o.venue.governorate.nameFr}
              </Link>
              {o.description && <p className="mt-2 flex-1 text-sm text-stone-600">{o.description}</p>}
              <div className="mt-3 flex items-end justify-between gap-2 text-xs text-stone-500">
                <span>
                  {o.valueTnd ? <>{t("rewards.value", { n: o.valueTnd })}<br /></> : null}
                  {t("rewards.left", { n: o.stock })}
                </span>
                <RedeemButton offerId={o.id} cost={o.pointsCost} balance={user?.points ?? null} stock={o.stock} loggedIn={!!user} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
