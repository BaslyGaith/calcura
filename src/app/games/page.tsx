import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { isGameEnabled, playsLeft } from "@/lib/game-limits";
import { getSettings } from "@/lib/settings";
import { openDrawsWhere } from "@/lib/draws";
import { GAMES, type GameId } from "@/lib/games";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { t } = getT();
  const user = await getCurrentUser();
  const settings = await getSettings();
  const enabled: GameId[] = [];
  for (const g of GAMES) if (await isGameEnabled(g, settings)) enabled.push(g);
  const left = user ? await Promise.all(enabled.map((g) => playsLeft(user.id, g))) : null;
  const draw = await prisma.draw.findFirst({ where: openDrawsWhere(), orderBy: { endsAt: "asc" } });
  const myTickets = draw && user ? (await prisma.drawEntry.findUnique({ where: { drawId_userId: { drawId: draw.id, userId: user.id } } }))?.tickets ?? 0 : 0;
  const meta: Record<GameId, { emoji: string; href: string; title: DictKey; desc: string }> = {
    PUZZLE: { emoji: "🧩", href: "/games/puzzle", title: "games.puzzle", desc: t("games.puzzle.desc") },
    QUIZ: { emoji: "🧠", href: "/games/quiz", title: "games.quiz", desc: t("games.quiz.menuDesc") },
    MEMORY: { emoji: "🃏", href: "/games/memory", title: "games.memory", desc: t("games.memory.desc") },
    WHEEL: { emoji: "🎡", href: "/games/wheel", title: "games.wheel", desc: t("games.wheel.desc", { n: settings.wheelMaxPoints }) },
  };

  return (
    <div className="container-bp py-8">
      <h1 className="h1">{t("games.title")}</h1>
      <p className="mt-1 text-stone-600">{t("games.subtitle")}</p>
      {user ? (
        <p className="mt-3 inline-block rounded-xl bg-amber-100 px-3 py-1 font-semibold text-amber-900">⭐ {t("rewards.balance", { n: user.points })}</p>
      ) : (
        <p className="mt-3"><Link className="font-semibold text-brand-600" href="/login">{t("games.loginToPlay")}</Link></p>
      )}
      {draw && (
        <Link href="/draws" className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-olive-500 to-lime-500 p-4 font-semibold text-white shadow-sm hover:brightness-105">
          <span className="text-3xl">🎟️</span>
          <span>{t("draws.banner", { prize: draw.prize, n: myTickets })}</span>
          <span className="ml-auto">→</span>
        </Link>
      )}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {enabled.map((g, i) => {
          const m = meta[g];
          const n = left?.[i];
          return (
            <div key={g} className={`card flex flex-col p-6 ${g === "PUZZLE" ? "border-brand-300 ring-2 ring-brand-100" : ""}`}>
              <div className="text-5xl">{m.emoji}</div>
              <h2 className="h2 mt-3">{t(m.title)}</h2>
              <p className="mt-1 flex-1 text-sm text-stone-600">{m.desc}</p>
              {g === "PUZZLE" && draw && <p className="mt-2 text-xs font-semibold text-olive-600">🎟️ {t("draws.howToGet", { n: settings.puzzleTicketsPerWin })}</p>}
              {n !== undefined && <p className="mt-3 text-xs font-semibold text-stone-500">{n > 0 ? t("games.playsLeft", { n }) : t("games.noPlaysLeft")}</p>}
              <Link href={user ? m.href : "/login"} className={`btn-primary mt-3 ${n === 0 ? "pointer-events-none opacity-50" : ""}`}>{t("games.play")}</Link>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/draws" className="btn-success">🎟️ {t("nav.draws")}</Link>
        <Link href="/rewards" className="btn-secondary">🎁 {t("nav.rewards")}</Link>
        <Link href="/leaderboard" className="btn-secondary">🏆 {t("nav.leaderboard")}</Link>
      </div>
    </div>
  );
}
