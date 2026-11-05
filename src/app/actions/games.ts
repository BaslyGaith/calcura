"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/auth";
import { addPoints } from "@/lib/points";
import { getSettings } from "@/lib/settings";
import { isGameEnabled, playsLeft } from "@/lib/game-limits";
import { applySwaps, isSolved, minSwaps, PUZZLE_SIZES, scoreMemory, scorePuzzle, scoreQuiz, shufflePuzzle, spinWheel, wheelValues, type GameId } from "@/lib/games";
import { pickPuzzlePhoto } from "@/lib/puzzle-picker";
import { grantTickets } from "@/lib/draws";
import { buildQuiz } from "@/lib/quiz-builder";
import { recordView } from "@/lib/views";
import { decryptData, encryptData, signData, verifyData } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

type Fail = { ok: false; error: string };

async function guard(game: GameId): Promise<{ ok: true; userId: string } | Fail> {
  const { t } = getT();
  let user;
  try { user = await assertUser(); } catch { return { ok: false, error: t("games.loginToPlay") }; }
  if (!(await isGameEnabled(game))) return { ok: false, error: t("games.disabled") };
  if ((await playsLeft(user.id, game)) <= 0) return { ok: false, error: t("games.noPlaysLeft") };
  return { ok: true, userId: user.id };
}

async function record(userId: string, game: GameId, score: number, points: number, tickets = 0) {
  const granted = await prisma.$transaction(async (tx) => {
    await tx.gamePlay.create({ data: { userId, game, score, pointsEarned: points } });
    await addPoints(userId, points, "GAME", game, tx);
    return grantTickets(userId, tickets, tx);
  });
  revalidatePath("/games");
  revalidatePath("/draws");
  return granted;
}

// ---------- Quiz ----------
export async function startQuiz() {
  const g = await guard("QUIZ");
  if (!g.ok) return g;
  const { locale } = getT();
  const { questions, key } = await buildQuiz(locale);
  // Chaque établissement affiché dans le quiz gagne une impression (statistique de visibilité).
  await Promise.all(questions.filter((q) => q.venue).map((q) => recordView(q.venue!.id, g.userId, "GAME_SHOWN")));
  // Jeton chiffré : contient la clé de correction, illisible côté client.
  const token = await encryptData({ uid: g.userId, game: "QUIZ", key }, 900);
  return { ok: true as const, token, questions };
}

export async function submitQuiz(token: string, answers: { id: number; choice: number }[]) {
  const { t } = getT();
  const data = await decryptData<{ uid: string; game: string; key: Record<number, number> }>(token);
  const g = await guard("QUIZ");
  if (!g.ok) return g;
  if (!data || data.game !== "QUIZ" || data.uid !== g.userId) return { ok: false as const, error: t("common.error") };
  // Seules les questions réellement posées comptent.
  const correct = scoreQuiz(answers, data.key);
  const { quizPointsPerAnswer } = await getSettings();
  const points = correct * quizPointsPerAnswer;
  await record(g.userId, "QUIZ", correct, points);
  return { ok: true as const, correct, total: Object.keys(data.key).length, points };
}

// ---------- Memory ----------
export async function startMemory() {
  const g = await guard("MEMORY");
  if (!g.ok) return g;
  const token = await signData({ uid: g.userId, game: "MEMORY", t0: Date.now() }, 1800);
  return { ok: true as const, token };
}

export async function submitMemory(token: string, moves: number) {
  const { t } = getT();
  const data = await verifyData<{ uid: string; game: string; t0: number }>(token);
  const g = await guard("MEMORY");
  if (!g.ok) return g;
  if (!data || data.game !== "MEMORY" || data.uid !== g.userId) return { ok: false as const, error: t("common.error") };
  const seconds = Math.round((Date.now() - data.t0) / 1000); // durée mesurée côté serveur
  const { memoryMaxPoints } = await getSettings();
  const points = scoreMemory(Math.floor(moves), seconds, memoryMaxPoints);
  await record(g.userId, "MEMORY", Math.floor(moves), points);
  return { ok: true as const, points, seconds };
}

// ---------- Roue ----------
export async function spin() {
  const g = await guard("WHEEL");
  if (!g.ok) return g;
  const { wheelMaxPoints } = await getSettings();
  const values = wheelValues(wheelMaxPoints);
  const index = spinWheel();
  await record(g.userId, "WHEEL", index, values[index]);
  return { ok: true as const, index, points: values[index], values };
}

// ---------- Puzzle photo de menu ----------
export async function startPuzzle(size: number) {
  const { t } = getT();
  const g = await guard("PUZZLE");
  if (!g.ok) return g;
  const sz = (PUZZLE_SIZES as readonly number[]).includes(size) ? size : 3;
  const photo = await pickPuzzlePhoto();
  if (!photo) return { ok: false as const, error: t("games.puzzle.noPhoto") };
  const perm = shufflePuzzle(sz);
  await recordView(photo.venue.id, g.userId, "GAME_SHOWN");
  // Jeton signé : le serveur rejouera les échanges à partir de ce mélange.
  const token = await signData({ uid: g.userId, game: "PUZZLE", size: sz, perm, t0: Date.now(), venueId: photo.venue.id }, 3600);
  return { ok: true as const, token, size: sz, perm, image: photo.url, venue: photo.venue, dish: photo.dish };
}

export async function submitPuzzle(token: string, swaps: [number, number][]) {
  const { t } = getT();
  const data = await verifyData<{ uid: string; game: string; size: number; perm: number[]; t0: number }>(token);
  const g = await guard("PUZZLE");
  if (!g.ok) return g;
  if (!data || data.game !== "PUZZLE" || data.uid !== g.userId || !Array.isArray(swaps) || swaps.length > 500) {
    return { ok: false as const, error: t("common.error") };
  }
  // Un même jeton ne peut servir qu'une fois.
  const reused = await prisma.gamePlay.count({ where: { userId: g.userId, game: "PUZZLE", createdAt: { gte: new Date(data.t0) } } });
  if (reused > 0) return { ok: false as const, error: t("common.error") };
  const final = applySwaps(data.perm, swaps);
  if (!final || !isSolved(final)) return { ok: false as const, error: t("games.puzzle.notSolved") };
  const seconds = Math.round((Date.now() - data.t0) / 1000); // mesuré côté serveur
  const settings = await getSettings();
  const points = scorePuzzle(data.size, swaps.length, minSwaps(data.perm), seconds, settings.puzzleMaxPoints);
  const tickets = points > 0 ? settings.puzzleTicketsPerWin : 0;
  const granted = await record(g.userId, "PUZZLE", swaps.length, points, tickets);
  return { ok: true as const, points, seconds, moves: swaps.length, tickets: granted };
}
