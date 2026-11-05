import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { runDueDraws } from "@/lib/draws";
import { cancelDraw, createDraw, drawNow } from "@/app/actions/admin";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AdminDraws() {
  await runDueDraws();
  const { t, locale } = getT();
  const [draws, venues] = await Promise.all([
    prisma.draw.findMany({
      include: { venue: { select: { id: true, name: true } }, winner: { select: { name: true, email: true } }, entries: { select: { tickets: true } } },
      orderBy: [{ status: "desc" }, { endsAt: "desc" }],
      take: 50,
    }),
    // Lots offerts par les établissements des commerçants (le bon gagnant pourra être validé par eux).
    prisma.venue.findMany({ where: { ownerId: { not: null } }, select: { id: true, name: true, city: true }, orderBy: { name: "asc" }, take: 500 }),
  ]);
  const vouchers = await prisma.voucher.findMany({ where: { id: { in: draws.flatMap((d) => (d.prizeVoucherId ? [d.prizeVoucherId] : [])) } }, select: { id: true, code: true, status: true } });
  const voucherById = new Map(vouchers.map((v) => [v.id, v]));
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <form action={createDraw} className="card grid gap-3 p-5 sm:grid-cols-2">
        <h2 className="h2 sm:col-span-2">+ {t("admin.newDraw")}</h2>
        <div><label className="label" htmlFor="title">{t("admin.drawTitle")}</label><input id="title" name="title" required className="input" defaultValue="Grand tirage du mois" /></div>
        <div><label className="label" htmlFor="prize">{t("admin.prize")}</label><input id="prize" name="prize" required className="input" defaultValue="Un repas pour 2 personnes" /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="description">{t("merchant.description")}</label><input id="description" name="description" className="input" /></div>
        <div>
          <label className="label" htmlFor="venueId">{t("admin.prizeVenue")}</label>
          <select id="venueId" name="venueId" className="input">
            <option value="">—</option>
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}{v.city ? ` (${v.city})` : ""}</option>)}
          </select>
        </div>
        <div><label className="label" htmlFor="prizeValueTnd">{t("admin.prizeValue")}</label><input id="prizeValueTnd" name="prizeValueTnd" type="number" step="0.5" min={0} className="input" /></div>
        <div><label className="label" htmlFor="startsAt">{t("admin.startsAt")}</label><input id="startsAt" name="startsAt" type="date" className="input" /></div>
        <div><label className="label" htmlFor="endsAt">{t("admin.endsAt")}</label><input id="endsAt" name="endsAt" type="date" required defaultValue={in30} className="input" /></div>
        <div><label className="label" htmlFor="ticketCostPoints">{t("admin.ticketCost")}</label><input id="ticketCostPoints" name="ticketCostPoints" type="number" min={0} defaultValue={50} className="input" /></div>
        <div><label className="label" htmlFor="maxTicketsPerUser">{t("admin.maxTickets")}</label><input id="maxTicketsPerUser" name="maxTicketsPerUser" type="number" min={1} defaultValue={50} className="input" /></div>
        <div className="sm:col-span-2"><button className="btn-primary">{t("admin.newDraw")}</button></div>
      </form>

      <div className="card overflow-x-auto">
        <table className="table-bp min-w-[850px]">
          <thead><tr><th>{t("admin.drawTitle")}</th><th>{t("admin.endsAt")}</th><th>{t("admin.participants")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
          <tbody>
            {draws.map((d) => {
              const voucher = d.prizeVoucherId ? voucherById.get(d.prizeVoucherId) : undefined;
              return (
                <tr key={d.id}>
                  <td>
                    <div className="font-semibold">{d.title}</div>
                    <div className="text-xs text-stone-500">🎁 {d.prize}{d.venue ? <> — <Link className="underline" href={`/venues/${d.venue.id}`}>{d.venue.name}</Link></> : null}</div>
                  </td>
                  <td className="text-xs">{d.endsAt.toLocaleDateString(locale)}</td>
                  <td className="text-xs">{d.entries.filter((e) => e.tickets > 0).length} · 🎟️ {d.entries.reduce((a, e) => a + e.tickets, 0)}</td>
                  <td>
                    <span className={`badge ${d.status === "OPEN" ? "bg-lime-100 text-lime-800" : d.status === "DRAWN" ? "bg-amber-100 text-amber-900" : "bg-stone-200 text-stone-600"}`}>{t(`status.${d.status}` as DictKey)}</span>
                    {d.status === "DRAWN" && (
                      <div className="mt-1 text-xs">
                        {d.winner ? <>🏆 {d.winner.name} · {d.winner.email}</> : t("draws.noWinner")}
                        {voucher && <div className="font-mono">{t("admin.voucherCreated")} : {voucher.code} ({t(`voucher.${voucher.status}` as DictKey)})</div>}
                      </div>
                    )}
                  </td>
                  <td>
                    {d.status === "OPEN" && (
                      <div className="flex flex-wrap gap-1">
                        <form action={drawNow}><input type="hidden" name="id" value={d.id} /><button className="btn-success btn-sm">🎲 {t("admin.drawNow")}</button></form>
                        <form action={cancelDraw}><input type="hidden" name="id" value={d.id} /><button className="btn-secondary btn-sm">{t("admin.cancelDraw")}</button></form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {draws.length === 0 && <p className="p-6 text-stone-500">{t("common.none")}</p>}
      </div>
    </div>
  );
}
