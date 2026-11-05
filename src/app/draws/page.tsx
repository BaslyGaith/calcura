import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { openDrawsWhere, runDueDraws } from "@/lib/draws";
import { BuyTickets } from "./BuyTickets";

export const dynamic = "force-dynamic";

const shortName = (n: string) => { const [a, b] = n.split(" "); return b ? `${a} ${b[0]}.` : a; };

export default async function DrawsPage() {
  await runDueDraws(); // les tirages échus sont effectués même sans tâche planifiée
  const { t, locale } = getT();
  const user = await getCurrentUser();
  const settings = await getSettings();
  const [open, past] = await Promise.all([
    prisma.draw.findMany({
      where: openDrawsWhere(),
      include: { venue: { select: { id: true, name: true, city: true, coverImage: true } }, entries: { select: { userId: true, tickets: true } } },
      orderBy: { endsAt: "asc" },
    }),
    prisma.draw.findMany({
      where: { status: "DRAWN" },
      include: { venue: { select: { id: true, name: true } }, winner: { select: { id: true, name: true } } },
      orderBy: { drawnAt: "desc" },
      take: 10,
    }),
  ]);
  const won = user ? past.filter((d) => d.winner?.id === user.id) : [];

  return (
    <div className="container-bp max-w-4xl py-8">
      <h1 className="h1">🎟️ {t("draws.title")}</h1>
      <p className="mt-1 text-stone-600">{t("draws.subtitle")}</p>

      {won.map((d) => (
        <Link key={d.id} href="/me" className="mt-4 block rounded-2xl bg-amber-100 p-4 font-semibold text-amber-900">{t("draws.youWon", { prize: d.prize })}</Link>
      ))}

      {open.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-stone-500">{t("draws.noOpen")}</p>
      ) : (
        <div className="mt-6 space-y-4">
          {open.map((d) => {
            const total = d.entries.reduce((a, e) => a + e.tickets, 0);
            const mine = user ? d.entries.find((e) => e.userId === user.id)?.tickets ?? 0 : 0;
            const chance = total > 0 ? (mine / total) * 100 : 0;
            return (
              <section key={d.id} className="card overflow-hidden sm:flex">
                <div className="relative h-40 shrink-0 bg-gradient-to-br from-olive-500 to-lime-400 sm:h-auto sm:w-56">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {d.venue?.coverImage && <img src={d.venue.coverImage} alt="" className="h-full w-full object-cover" />}
                  <span className="absolute left-3 top-3 badge bg-white/95 text-olive-600">🎁 {d.prize}</span>
                </div>
                <div className="flex-1 p-5">
                  <h2 className="h2">{d.title}</h2>
                  {d.venue && (
                    <Link href={`/venues/${d.venue.id}`} className="text-sm text-brand-600 hover:underline">
                      {t("draws.offeredBy", { venue: d.venue.name })}{d.venue.city ? ` · ${d.venue.city}` : ""}
                    </Link>
                  )}
                  {d.description && <p className="mt-2 text-sm text-stone-600">{d.description}</p>}
                  <p className="mt-2 text-sm font-semibold">📅 {t("draws.endsOn", { d: d.endsAt.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) })}</p>
                  <p className="text-xs text-stone-500">{t("draws.totalTickets", { n: total, p: d.entries.filter((e) => e.tickets > 0).length })}</p>
                  {user && (
                    <div className="mt-3 rounded-xl bg-stone-50 p-3">
                      <p className="font-bold">🎟️ {t("draws.myTickets", { n: mine })}</p>
                      {mine > 0 && <p className="text-xs text-stone-500">{t("draws.chance", { p: chance < 1 ? chance.toFixed(2) : chance.toFixed(1) })}</p>}
                    </div>
                  )}
                  <p className="mt-3 text-xs text-stone-500">{t("draws.howToGet", { n: settings.puzzleTicketsPerWin })}</p>
                  <div className="mt-3 flex flex-wrap items-start gap-2">
                    <Link href={user ? "/games/puzzle" : "/login"} className="btn-primary btn-sm">🧩 {t("draws.puzzleCta")}</Link>
                    {user && d.ticketCostPoints > 0 && <BuyTickets drawId={d.id} cost={d.ticketCostPoints} balance={user.points} />}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="h2 mb-3">{t("draws.past")}</h2>
          <ul className="card divide-y divide-stone-100">
            {past.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span><span className="font-semibold">{d.prize}</span>{d.venue ? ` — ${d.venue.name}` : ""}</span>
                <span className="text-stone-500">
                  {d.drawnAt?.toLocaleDateString(locale)} · {d.winner ? t("draws.winner", { name: shortName(d.winner.name) }) : t("draws.noWinner")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
