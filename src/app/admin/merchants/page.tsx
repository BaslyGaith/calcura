import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { createSubscription, setSubscriptionStatus, setUserStatus } from "@/app/actions/admin";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AdminMerchants({ searchParams }: { searchParams: { q?: string } }) {
  const { t, locale } = getT();
  const q = searchParams.q?.trim();
  const settings = await getSettings();
  const merchants = await prisma.user.findMany({
    where: { role: "MERCHANT", ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}) },
    include: { venues: { select: { id: true, name: true, status: true } }, subscriptions: { orderBy: { createdAt: "desc" }, take: 5 } },
    orderBy: { createdAt: "desc" },
  });
  const now = new Date();

  return (
    <div className="space-y-4">
      <form className="flex gap-2"><input name="q" defaultValue={q} placeholder={t("admin.search")} className="input max-w-sm" /><button className="btn-secondary">{t("common.search")}</button></form>
      {merchants.length === 0 && <p className="card p-6 text-stone-500">{t("common.none")}</p>}
      {merchants.map((m) => {
        const active = m.subscriptions.find((s) => s.status === "PAID" && s.startsAt <= now && s.endsAt >= now);
        return (
          <section key={m.id} className={`card p-5 ${m.status === "BLOCKED" ? "border-red-300 bg-red-50/40" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">{m.name} <span className={`badge ml-1 ${m.status === "ACTIVE" ? "bg-lime-100 text-lime-800" : "bg-red-100 text-red-700"}`}>{t(`status.${m.status}` as DictKey)}</span></h2>
                <p className="text-sm text-stone-500">{m.email} {m.phone ? `· ${m.phone}` : ""}</p>
                {m.blockReason && <p className="text-sm text-red-600">{t("common.reason")} : {m.blockReason}</p>}
                <p className={`mt-1 text-sm font-semibold ${active ? "text-olive-600" : "text-red-600"}`}>
                  {active ? t("merchant.subActive", { d: active.endsAt.toLocaleDateString(locale) }) : t("merchant.subNone")}
                </p>
              </div>
              <form action={setUserStatus} className="flex flex-wrap items-center gap-2">
                <input type="hidden" name="id" value={m.id} />
                {m.status === "ACTIVE" ? (
                  <>
                    <input name="reason" placeholder={t("common.reason")} className="input w-48" defaultValue="Abonnement impayé" />
                    <input type="hidden" name="status" value="BLOCKED" />
                    <button className="btn-danger btn-sm">{t("common.block")}</button>
                  </>
                ) : (
                  <><input type="hidden" name="status" value="ACTIVE" /><button className="btn-success btn-sm">{t("common.unblock")}</button></>
                )}
              </form>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase text-stone-500">{t("admin.venues")}</h3>
                <ul className="space-y-1 text-sm">
                  {m.venues.map((v) => <li key={v.id}><a href={`/venues/${v.id}`} className="hover:underline">{v.name}</a> <span className={`badge ${v.status === "ACTIVE" ? "bg-lime-100 text-lime-800" : "bg-red-100 text-red-700"}`}>{t(`status.${v.status}` as DictKey)}</span></li>)}
                  {m.venues.length === 0 && <li className="text-stone-400">—</li>}
                </ul>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-bold uppercase text-stone-500">{t("admin.subscriptions")}</h3>
                <table className="table-bp">
                  <tbody>
                    {m.subscriptions.map((s) => (
                      <tr key={s.id}>
                        <td className="text-xs">{t(`merchant.plan.${s.plan}` as DictKey)}<br />{s.startsAt.toLocaleDateString(locale)} → {s.endsAt.toLocaleDateString(locale)}</td>
                        <td>{s.amountTnd} {t("common.tnd")}</td>
                        <td><span className={`badge ${s.status === "PAID" ? "bg-lime-100 text-lime-800" : "bg-red-100 text-red-700"}`}>{t(`status.${s.status}` as DictKey)}</span></td>
                        <td>
                          <form action={setSubscriptionStatus}>
                            <input type="hidden" name="id" value={s.id} />
                            <input type="hidden" name="status" value={s.status === "PAID" ? "UNPAID" : "PAID"} />
                            <button className={s.status === "PAID" ? "btn-secondary btn-sm" : "btn-success btn-sm"}>{s.status === "PAID" ? t("admin.markUnpaid") : t("admin.markPaid")}</button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <form action={createSubscription} className="mt-3 flex flex-wrap items-end gap-2 rounded-xl bg-stone-50 p-3 text-sm">
                  <input type="hidden" name="merchantId" value={m.id} />
                  <select name="plan" className="input w-auto"><option value="MONTHLY">{t("merchant.plan.MONTHLY")}</option><option value="YEARLY">{t("merchant.plan.YEARLY")}</option></select>
                  <input name="amount" type="number" step="0.5" defaultValue={settings.subscriptionMonthly} className="input w-24" aria-label={t("admin.amount")} />
                  <input name="startsAt" type="date" className="input w-auto" />
                  <label className="flex items-center gap-1"><input type="checkbox" name="paid" defaultChecked /> {t("status.PAID")}</label>
                  <button className="btn-primary btn-sm">+ {t("admin.newSubscription")}</button>
                </form>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
