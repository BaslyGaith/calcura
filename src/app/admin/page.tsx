import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { runEnforcement } from "@/app/actions/admin";
import { dayKey } from "@/lib/views";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard({ searchParams }: { searchParams: { enforced?: string } }) {
  const { t, locale } = getT();
  const since = dayKey(new Date(Date.now() - 29 * 86400000));
  const [views30, topViewed] = await Promise.all([
    prisma.venueView.count({ where: { source: "PAGE", day: { gte: since } } }),
    prisma.venue.findMany({ where: { viewCount: { gt: 0 } }, orderBy: { viewCount: "desc" }, take: 10, select: { id: true, name: true, city: true, viewCount: true, type: true } }),
  ]);
  const [users, merchants, venues, blockedVenues, vouchers, games, revenue, unpaid, byGov, govs, recent] = await Promise.all([
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "MERCHANT" } }),
    prisma.venue.count(),
    prisma.venue.count({ where: { status: "BLOCKED" } }),
    prisma.voucher.count(),
    prisma.gamePlay.count(),
    prisma.subscription.aggregate({ where: { status: "PAID" }, _sum: { amountTnd: true } }),
    prisma.subscription.count({ where: { status: "UNPAID" } }),
    prisma.venue.groupBy({ by: ["governorateId", "type"], _count: { _all: true } }),
    prisma.governorate.findMany({ orderBy: { code: "asc" } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
  ]);
  const stats = [
    [t("admin.stat.users"), users, "👥"], [t("admin.stat.merchants"), merchants, "🏪"], [t("admin.stat.venues"), venues, "📍"],
    [t("admin.stat.blockedVenues"), blockedVenues, "⛔"], [t("admin.stat.vouchers"), vouchers, "🎟️"], [t("admin.stat.games"), games, "🎮"],
    [t("admin.stat.revenue"), `${revenue._sum.amountTnd ?? 0} ${t("common.tnd")}`, "💰"], [t("admin.stat.unpaid"), unpaid, "⚠️"],
    [t("admin.stat.views30"), views30, "👁"],
  ] as const;
  const count = (gid: string, type: string) => byGov.find((b) => b.governorateId === gid && b.type === type)?._count._all ?? 0;
  const max = Math.max(1, ...govs.map((g) => count(g.id, "CAFE") + count(g.id, "RESTAURANT")));

  return (
    <div className="space-y-6">
      {searchParams.enforced !== undefined && <p className="rounded-xl bg-amber-50 p-3 font-semibold text-amber-900">{t("admin.enforced", { n: searchParams.enforced })}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([label, value, icon]) => (
          <div key={label} className="card p-4">
            <div className="text-xs font-semibold uppercase text-stone-500">{icon} {label}</div>
            <div className="mt-1 text-2xl font-extrabold">{value}</div>
          </div>
        ))}
      </div>
      <form action={runEnforcement}><button className="btn-danger">⛔ {t("admin.enforce")}</button></form>

      <section className="card p-5">
        <h2 className="h2 mb-4">{t("admin.byGovernorate")}</h2>
        <div className="space-y-1.5">
          {govs.map((g) => {
            const c = count(g.id, "CAFE"); const r = count(g.id, "RESTAURANT");
            return (
              <div key={g.id} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 truncate">{locale === "en" ? g.nameEn : g.nameFr}</span>
                <div className="flex h-4 flex-1 overflow-hidden rounded bg-stone-100">
                  <div className="bg-amber-700" style={{ width: `${(c / max) * 100}%` }} title={`${t("common.cafes")}: ${c}`} />
                  <div className="bg-brand-500" style={{ width: `${(r / max) * 100}%` }} title={`${t("common.restaurants")}: ${r}`} />
                </div>
                <span className="w-20 text-right text-xs text-stone-500">☕{c} 🍽️{r}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="h2 mb-3">👁 {t("admin.topViewed")}</h2>
        {topViewed.length === 0 ? <p className="text-sm text-stone-500">{t("common.none")}</p> : (
          <table className="table-bp">
            <tbody>
              {topViewed.map((v, i) => (
                <tr key={v.id}>
                  <td className="w-8 text-stone-400">{i + 1}</td>
                  <td><Link href={`/venues/${v.id}`} className="font-medium hover:underline">{v.type === "CAFE" ? "☕" : "🍽️"} {v.name}</Link> <span className="text-xs text-stone-500">{v.city}</span></td>
                  <td className="text-right font-bold">{v.viewCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card p-5">
        <h2 className="h2 mb-3">{t("admin.users")}</h2>
        <table className="table-bp">
          <tbody>
            {recent.map((u) => <tr key={u.id}><td className="font-medium">{u.name}</td><td>{u.email}</td><td>{u.role}</td><td className="text-xs text-stone-500">{u.createdAt.toLocaleDateString(locale)}</td></tr>)}
          </tbody>
        </table>
      </section>
    </div>
  );
}
