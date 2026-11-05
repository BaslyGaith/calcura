// Tirages au sort : les joueurs gagnent des tickets (puzzle terminé) ou en achètent
// avec leurs points ; à la date de fin, un gagnant est tiré au sort, pondéré par le
// nombre de tickets. Le lot (ex. un repas) devient un bon d'achat dans « Mes bons ».
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { generateVoucherCode } from "./points";
import { getSettings } from "./settings";

type Tx = Prisma.TransactionClient;

export function openDrawsWhere(now = new Date()): Prisma.DrawWhereInput {
  return { status: "OPEN", startsAt: { lte: now }, endsAt: { gt: now } };
}

/** Ajoute `n` tickets à l'utilisateur dans chaque tirage ouvert (dans la limite par joueur). */
export async function grantTickets(userId: string, n: number, tx: Tx = prisma, now = new Date()) {
  if (n <= 0) return 0;
  const draws = await tx.draw.findMany({ where: openDrawsWhere(now), select: { id: true, maxTicketsPerUser: true } });
  let granted = 0;
  for (const d of draws) {
    const entry = await tx.drawEntry.findUnique({ where: { drawId_userId: { drawId: d.id, userId } } });
    const add = Math.min(n, Math.max(0, d.maxTicketsPerUser - (entry?.tickets ?? 0)));
    if (add <= 0) continue;
    await tx.drawEntry.upsert({
      where: { drawId_userId: { drawId: d.id, userId } },
      update: { tickets: { increment: add } },
      create: { drawId: d.id, userId, tickets: add },
    });
    granted += add;
  }
  return granted;
}

/** Tirage pondéré : chaque ticket est une chance. `rand` ∈ [0, 1). */
export function pickWeighted<T extends { tickets: number }>(entries: T[], rand: number): T | null {
  const valid = entries.filter((e) => e.tickets > 0);
  const total = valid.reduce((a, e) => a + e.tickets, 0);
  if (total === 0) return null;
  let r = Math.floor(rand * total);
  for (const e of valid) {
    if (r < e.tickets) return e;
    r -= e.tickets;
  }
  return valid[valid.length - 1];
}

function secureRandom() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

/**
 * Effectue le tirage d'un concours encore ouvert. Les comptes bloqués sont exclus.
 * Si un établissement offre le lot, un bon d'achat est créé pour le gagnant : le
 * commerçant le valide comme n'importe quel bon.
 */
export async function performDraw(drawId: string, rand: () => number = secureRandom) {
  const settings = await getSettings();
  return prisma.$transaction(async (tx) => {
    const draw = await tx.draw.findUnique({ where: { id: drawId } });
    if (!draw || draw.status !== "OPEN") return null;
    const entries = await tx.drawEntry.findMany({ where: { drawId, tickets: { gt: 0 }, user: { status: "ACTIVE" } }, orderBy: { userId: "asc" } });
    const winner = pickWeighted(entries, rand());
    let prizeVoucherId: string | null = null;
    if (winner && draw.venueId) {
      const offer = await tx.offer.create({
        data: { venueId: draw.venueId, title: `🎉 ${draw.prize}`, description: draw.title, pointsCost: 0, valueTnd: draw.prizeValueTnd, stock: 0, active: false },
      });
      const voucher = await tx.voucher.create({
        data: { code: generateVoucherCode(), userId: winner.userId, offerId: offer.id, pointsPaid: 0, expiresAt: new Date(Date.now() + settings.voucherValidityDays * 86400000) },
      });
      prizeVoucherId = voucher.id;
    }
    // Mise à jour conditionnelle : un double tirage concurrent ne produit qu'un gagnant.
    const r = await tx.draw.updateMany({
      where: { id: drawId, status: "OPEN" },
      data: { status: "DRAWN", winnerId: winner?.userId ?? null, prizeVoucherId, drawnAt: new Date() },
    });
    if (r.count === 0) throw new Error("ALREADY_DRAWN");
    return { winnerId: winner?.userId ?? null, prizeVoucherId };
  });
}

/** Tire au sort tous les concours arrivés à échéance (appelé par le cron et les pages). */
export async function runDueDraws(now = new Date()) {
  const due = await prisma.draw.findMany({ where: { status: "OPEN", endsAt: { lte: now } }, select: { id: true } });
  let drawn = 0;
  for (const d of due) {
    try {
      if (await performDraw(d.id)) drawn++;
    } catch (e) {
      if (!(e instanceof Error && e.message === "ALREADY_DRAWN")) throw e;
    }
  }
  return drawn;
}
