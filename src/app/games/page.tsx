import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { playsLeft } from "@/lib/game-limits";
import { getSettings } from "@/lib/settings";
import { GAMES } from "@/lib/games";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const { t } = getT();
  const user = await getCurrentUser();
  const settings = await getSettings();
  const left = user ? await Promise.all(GAMES.map((g) => playsLeft(user.id, g))) : null;
  const meta = {
    QUIZ: { emoji: "🧠", href: "/games/quiz", title: "games.quiz", desc: t("games.quiz.desc") },
    MEMORY: { emoji: "🃏", href: "/games/memory", title: "games.memory", desc: t("games.memory.desc") },
    WHEEL: { emoji: "🎡", href: "/games/wheel", title: "games.wheel", desc: t("games.wheel.desc", { n: settings.wheelMaxPoints }) },
  } as const;

  return (
    <div className="container-bp py-8">
      <h1 className="h1">{t("games.title")}</h1>
      <p className="mt-1 text-stone-600">{t("games.subtitle")}</p>
      {user ? (
        <p className="mt-3 inline-block rounded-xl bg-amber-100 px-3 py-1 font-semibold text-amber-900">⭐ {t("rewards.balance", { n: user.points })}</p>
      ) : (
        <p className="mt-3"><Link className="font-semibold text-brand-600" href="/login">{t("games.loginToPlay")}</Link></p>
      )}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {GAMES.map((g, i) => {
          const m = meta[g];
          const n = left?.[i];
          return (
            <div key={g} className="card flex flex-col p-6">
              <div className="text-5xl">{m.emoji}</div>
              <h2 className="h2 mt-3">{t(m.title as DictKey)}</h2>
              <p className="mt-1 flex-1 text-sm text-stone-600">{m.desc}</p>
              {n !== undefined && <p className="mt-3 text-xs font-semibold text-stone-500">{n > 0 ? t("games.playsLeft", { n }) : t("games.noPlaysLeft")}</p>}
              <Link href={user ? m.href : "/login"} className={`btn-primary mt-3 ${n === 0 ? "pointer-events-none opacity-50" : ""}`}>{t("games.play")}</Link>
            </div>
          );
        })}
      </div>
      <div className="mt-8 flex gap-3">
        <Link href="/rewards" className="btn-success">🎁 {t("nav.rewards")}</Link>
        <Link href="/leaderboard" className="btn-secondary">🏆 {t("nav.leaderboard")}</Link>
      </div>
    </div>
  );
}
