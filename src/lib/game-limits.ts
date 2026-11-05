import { prisma } from "./db";
import { getSettings } from "./settings";
import { startOfToday } from "./points";
import type { GameId } from "./games";

/** Nombre de parties autorisées par jour : 1 pour la roue, réglable pour les autres. */
export async function dailyLimit(game: GameId) {
  if (game === "WHEEL") return 1;
  return (await getSettings()).dailyPlaysPerGame;
}

export async function playsLeft(userId: string, game: GameId) {
  const [limit, used] = await Promise.all([
    dailyLimit(game),
    prisma.gamePlay.count({ where: { userId, game, createdAt: { gte: startOfToday() } } }),
  ]);
  return Math.max(0, limit - used);
}
