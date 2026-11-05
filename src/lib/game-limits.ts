import { prisma } from "./db";
import { getSettings, type Settings } from "./settings";
import { startOfToday } from "./points";
import type { GameId } from "./games";

const ENABLED_KEY: Record<GameId, keyof Settings> = {
  PUZZLE: "puzzleEnabled",
  QUIZ: "quizEnabled",
  MEMORY: "memoryEnabled",
  WHEEL: "wheelEnabled",
};

/** Un jeu peut être masqué par l'admin (Paramètres). */
export async function isGameEnabled(game: GameId, settings?: Settings) {
  const s = settings ?? (await getSettings());
  return s[ENABLED_KEY[game]] !== 0;
}

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
