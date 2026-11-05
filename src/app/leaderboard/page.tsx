import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { t } = getT();
  const me = await getCurrentUser();
  const since = new Date(Date.now() - 30 * 86400000);
  const rows = await prisma.gamePlay.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: since } },
    _sum: { pointsEarned: true },
    orderBy: { _sum: { pointsEarned: "desc" } },
    take: 50,
  });
  const users = await prisma.user.findMany({ where: { id: { in: rows.map((r) => r.userId) } }, select: { id: true, name: true } });
  const nameOf = new Map(users.map((u) => [u.id, u.name]));
  // Affichage discret : prénom + initiale du nom.
  const short = (n: string) => { const [a, b] = n.split(" "); return b ? `${a} ${b[0]}.` : a; };
  const medal = ["🥇", "🥈", "🥉"];

  return (
    <div className="container-bp max-w-2xl py-8">
      <h1 className="h1">🏆 {t("leaderboard.title")}</h1>
      <p className="mt-1 text-stone-600">{t("leaderboard.subtitle")}</p>
      <div className="card mt-6 overflow-hidden">
        {rows.length === 0 ? <p className="p-8 text-center text-stone-500">{t("common.none")}</p> : (
          <table className="table-bp">
            <thead><tr><th>{t("leaderboard.rank")}</th><th>{t("leaderboard.player")}</th><th className="text-right">{t("common.points")}</th></tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.userId} className={r.userId === me?.id ? "bg-amber-50 font-semibold" : ""}>
                  <td className="w-16 text-lg">{medal[i] ?? i + 1}</td>
                  <td>{short(nameOf.get(r.userId) ?? "—")}</td>
                  <td className="text-right font-bold text-brand-600">{r._sum.pointsEarned ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
