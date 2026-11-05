"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/auth";
import { addPoints } from "@/lib/points";
import { getSettings } from "@/lib/settings";
import { playsLeft } from "@/lib/game-limits";
import { scoreMemory, scoreQuiz, spinWheel, wheelValues, type GameId } from "@/lib/games";
import { buildQuiz } from "@/lib/quiz-builder";
import { recordView } from "@/lib/views";
import { decryptData, encryptData, signData, verifyData } from "@/lib/session";
import { getT } from "@/lib/i18n/server";

type Fail = { ok: false; error: string };

async function guard(game: GameId): Promise<{ ok: true; userId: string } | Fail> {
  const { t } = getT();
  let user;
  try { user = await assertUser(); } catch { return { ok: false, error: t("games.loginToPlay") }; }
  if ((await playsLeft(user.id, game)) <= 0) return { ok: false, error: t("games.noPlaysLeft") };
  return { ok: true, userId: user.id };
}

async function record(userId: string, game: GameId, score: number, points: number) {
  await prisma.$transaction(async (tx) => {
    await tx.gamePlay.create({ data: { userId, game, score, pointsEarned: points } });
    await addPoints(userId, points, "GAME", game, tx);
  });
  revalidatePath("/games");
}

// ---------- Quiz ----------
export async function startQuiz() {
  const g = await guard("QUIZ");
  if (!g.ok) return g;
  const { locale } = getT();
  const { questions, key } = await buildQuiz(locale);
  // Chaque établissement affiché dans le quiz gagne une impression (statistique de visibilité).
  await Promise.all(questions.filter((q) => q.venue).map((q) => recordView(q.venue!.id, g.userId, "QUIZ_SHOWN")));
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
