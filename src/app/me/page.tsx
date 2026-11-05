import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { CancelVoucher } from "./CancelVoucher";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const user = await requireUser();
  const { t, locale } = getT();
  const now = new Date();
  // Les bons dépassés passent en « expiré ».
  await prisma.voucher.updateMany({ where: { userId: user.id, status: "ISSUED", expiresAt: { lt: now } }, data: { status: "EXPIRED" } });
  const [vouchers, favorites, history, settings] = await Promise.all([
    prisma.voucher.findMany({ where: { userId: user.id }, include: { offer: { include: { venue: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.favorite.findMany({ where: { userId: user.id }, include: { venue: { include: { governorate: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.pointTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 }),
    getSettings(),
  ]);
  const statusColor: Record<string, string> = { ISSUED: "bg-lime-100 text-lime-800", REDEEMED: "bg-stone-200 text-stone-700", EXPIRED: "bg-red-100 text-red-700", CANCELLED: "bg-stone-100 text-stone-500" };

  return (
    <div className="container-bp space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="h1">{t("me.title")}</h1>
          <p className="text-stone-600">{user.name} · {user.email} · {t(`role.${user.role}` as DictKey)}</p>
        </div>
        <div className="card bg-gradient-to-br from-amber-100 to-orange-100 px-6 py-4 text-center">
          <div className="text-xs font-semibold uppercase text-amber-900">{t("me.points")}</div>
          <div className="text-3xl font-extrabold text-amber-900">⭐ {user.points}</div>
        </div>
      </div>

      <section className="card p-5">
        <h2 className="h2 mb-3">🎟️ {t("me.vouchers")}</h2>
        {vouchers.length === 0 ? <p className="text-sm text-stone-500">{t("common.none")} <Link href="/rewards" className="font-semibold text-brand-600">{t("nav.rewards")} →</Link></p> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {vouchers.map((v) => (
              <div key={v.id} className={`rounded-xl border-2 border-dashed p-4 ${v.status === "ISSUED" ? "border-olive-500 bg-lime-50" : "border-stone-200 opacity-70"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold">{v.offer.title}</div>
                    <Link href={`/venues/${v.offer.venueId}`} className="text-sm text-brand-600">{v.offer.venue.name}</Link>
                  </div>
                  <span className={`badge ${statusColor[v.status]}`}>{t(`voucher.${v.status}` as DictKey)}</span>
                </div>
                <div className="mt-3 rounded-lg bg-white p-2 text-center font-mono text-xl font-bold tracking-widest">{v.code}</div>
                <div className="mt-2 flex items-center justify-between text-xs text-stone-500">
                  <span>{v.status === "ISSUED" ? t("me.voucherShow") : ""} {t("me.voucherExpires", { d: v.expiresAt.toLocaleDateString(locale) })}</span>
                  {v.status === "ISSUED" && <CancelVoucher id={v.id} label={t("common.cancel")} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="h2 mb-3">❤️ {t("me.favorites")}</h2>
          {favorites.length === 0 ? <p className="text-sm text-stone-500">{t("common.none")}</p> : (
            <ul className="divide-y divide-stone-100">
              {favorites.map((f) => (
                <li key={f.venueId} className="py-2">
                  <Link href={`/venues/${f.venueId}`} className="font-semibold hover:text-brand-600">{f.venue.type === "CAFE" ? "☕" : "🍽️"} {f.venue.name}</Link>
                  <span className="ml-2 text-xs text-stone-500">{f.venue.city ?? (locale === "en" ? f.venue.governorate.nameEn : f.venue.governorate.nameFr)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="h2 mb-3">🤝 {t("me.referral")}</h2>
          <p className="text-sm text-stone-600">{t("me.referralText", { n: settings.referralPoints })}</p>
          <div className="mt-3 rounded-lg bg-stone-50 p-3 text-center font-mono text-2xl font-bold tracking-widest">{user.referralCode}</div>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="h2 mb-3">📈 {t("me.history")}</h2>
        {history.length === 0 ? <p className="text-sm text-stone-500">{t("common.none")}</p> : (
          <table className="table-bp">
            <tbody>
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="text-xs text-stone-500">{h.createdAt.toLocaleString(locale)}</td>
                  <td>{t(`reason.${h.reason}` as DictKey)} {h.detail ? <span className="text-stone-500">— {h.detail}</span> : null}</td>
                  <td className={`text-right font-semibold ${h.amount >= 0 ? "text-olive-600" : "text-red-600"}`}>{h.amount > 0 ? "+" : ""}{h.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
