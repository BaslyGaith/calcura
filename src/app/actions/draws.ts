"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/auth";
import { openDrawsWhere } from "@/lib/draws";
import { getT } from "@/lib/i18n/server";

export type BuyResult = { ok: true } | { ok: false; error: string };

/** Achète des tickets de tirage avec des points (si le tirage le permet). */
export async function buyTickets(drawId: string, count: number): Promise<BuyResult> {
  const { t } = getT();
  let user;
  try { user = await assertUser(); } catch { return { ok: false, error: t("games.loginToPlay") }; }
  const n = Math.floor(count);
  if (!Number.isFinite(n) || n < 1 || n > 50) return { ok: false, error: t("common.error") };
  try {
    await prisma.$transaction(async (tx) => {
      const draw = await tx.draw.findFirst({ where: { id: drawId, ...openDrawsWhere() } });
      if (!draw || draw.ticketCostPoints <= 0) throw new Error(t("common.error"));
      const entry = await tx.drawEntry.findUnique({ where: { drawId_userId: { drawId, userId: user.id } } });
      if ((entry?.tickets ?? 0) + n > draw.maxTicketsPerUser) throw new Error(t("draws.maxReached", { n: draw.maxTicketsPerUser }));
      const cost = draw.ticketCostPoints * n;
      const debit = await tx.user.updateMany({ where: { id: user.id, points: { gte: cost } }, data: { points: { decrement: cost } } });
      if (debit.count === 0) throw new Error(t("rewards.notEnough"));
      await tx.pointTransaction.create({ data: { userId: user.id, amount: -cost, reason: "DRAW", detail: `${n} × ${draw.title}` } });
      await tx.drawEntry.upsert({
        where: { drawId_userId: { drawId, userId: user.id } },
        update: { tickets: { increment: n } },
        create: { drawId, userId: user.id, tickets: n },
      });
    });
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : t("common.error") };
  }
  revalidatePath("/draws");
  return { ok: true };
}
