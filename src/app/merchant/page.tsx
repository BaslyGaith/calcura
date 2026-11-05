import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { activeSubscription, SUBSCRIPTION_BLOCK_REASON } from "@/lib/subscriptions";
import { RequestSubscription, ValidateVoucherForm } from "./MerchantForms";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function MerchantPage() {
  const user = await requireUser(["MERCHANT"]);
  const { t, locale } = getT();
  const [venues, sub, pendingSub, settings, redeemed, reviews, history] = await Promise.all([
    prisma.venue.findMany({ where: { ownerId: user.id }, include: { governorate: true, _count: { select: { photos: true, menuItems: true, offers: true } } }, orderBy: { createdAt: "desc" } }),
    activeSubscription(user.id),
    prisma.subscription.findFirst({ where: { merchantId: user.id, status: "UNPAID" } }),
    getSettings(),
    prisma.voucher.count({ where: { status: "REDEEMED", offer: { venue: { ownerId: user.id } } } }),
    prisma.review.count({ where: { venue: { ownerId: user.id } } }),
    prisma.subscription.findMany({ where: { merchantId: user.id }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);
  const blocked = user.status === "BLOCKED";
  const reasonLabel = (r: string | null) => (r === SUBSCRIPTION_BLOCK_REASON ? t("merchant.subNone") : r ?? "—");

  return (
    <div className="container-bp space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">🏪 {t("merchant.title")}</h1>
        {!blocked && <Link href="/merchant/venues/new" className="btn-primary">+ {t("merchant.newVenue")}</Link>}
      </div>

      {blocked && <p className="rounded-xl bg-red-50 p-4 font-semibold text-red-700">{t("merchant.blocked", { reason: user.blockReason ?? "—" })}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        <section className={`card p-5 md:col-span-2 ${sub ? "border-olive-500/50" : "border-red-300"}`}>
          <h2 className="h2 mb-2">💳 {t("merchant.subscription")}</h2>
          {sub ? (
            <p className="font-semibold text-olive-600">✔ {t("merchant.subActive", { d: sub.endsAt.toLocaleDateString(locale) })}</p>
          ) : (
            <>
              <p className="mb-3 font-semibold text-red-600">{t("merchant.subNone")}</p>
              {pendingSub ? <p className="text-sm text-stone-600">{t("merchant.subRequested")}</p> : <RequestSubscription prices={{ MONTHLY: settings.subscriptionMonthly, YEARLY: settings.subscriptionYearly }} />}
            </>
          )}
          {history.length > 0 && (
            <table className="table-bp mt-4">
              <tbody>
                {history.map((s) => (
                  <tr key={s.id}>
                    <td>{t(`merchant.plan.${s.plan}` as DictKey)}</td>
                    <td className="text-xs">{s.startsAt.toLocaleDateString(locale)} → {s.endsAt.toLocaleDateString(locale)}</td>
                    <td>{s.amountTnd} {t("common.tnd")}</td>
                    <td><span className={`badge ${s.status === "PAID" ? "bg-lime-100 text-lime-800" : "bg-red-100 text-red-700"}`}>{t(`status.${s.status}` as DictKey)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
        <section className="card p-5">
          <h2 className="h2 mb-2">📊 {t("merchant.stats")}</h2>
          <dl className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">{t("merchant.views")}</dt><dd className="text-2xl font-bold">{reviews}</dd></div>
            <div className="rounded-xl bg-stone-50 p-3"><dt className="text-xs text-stone-500">{t("merchant.redeemed")}</dt><dd className="text-2xl font-bold">{redeemed}</dd></div>
          </dl>
        </section>
      </div>

      {!blocked && (
        <section className="card p-5">
          <h2 className="h2 mb-3">✅ {t("merchant.validate")}</h2>
          <ValidateVoucherForm />
        </section>
      )}

      <section className="card p-5">
        <h2 className="h2 mb-3">{t("merchant.myVenues")}</h2>
        {venues.length === 0 ? <p className="text-sm text-stone-500">{t("common.none")}</p> : (
          <ul className="divide-y divide-stone-100">
            {venues.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <div className="font-semibold">{v.type === "CAFE" ? "☕" : "🍽️"} {v.name}</div>
                  <div className="text-xs text-stone-500">
                    {v.city ?? (locale === "en" ? v.governorate.nameEn : v.governorate.nameFr)} · {v._count.photos} 📷 · {v._count.menuItems} 🍴 · {v._count.offers} 🎁
                  </div>
                  {v.status === "BLOCKED" && <div className="text-xs font-semibold text-red-600">{t("merchant.venueBlocked", { reason: reasonLabel(v.blockReason) })}</div>}
                </div>
                <div className="flex gap-2">
                  <span className={`badge ${v.status === "ACTIVE" ? "bg-lime-100 text-lime-800" : "bg-red-100 text-red-700"}`}>{t(`status.${v.status}` as DictKey)}</span>
                  <Link href={`/venues/${v.id}`} className="btn-secondary btn-sm">👁</Link>
                  {!blocked && <Link href={`/merchant/venues/${v.id}`} className="btn-secondary btn-sm">{t("common.edit")}</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-stone-500">{t("merchant.claimHint")}</p>
      </section>
    </div>
  );
}
