import { prisma } from "./db";
import { getSettings } from "./settings";

export const SUBSCRIPTION_BLOCK_REASON = "SUBSCRIPTION_UNPAID";

/** Abonnement payé et en cours (délai de grâce inclus) d'un commerçant, s'il existe. */
export async function activeSubscription(merchantId: string, now = new Date()) {
  const { gracePeriodDays } = await getSettings();
  const limit = new Date(now.getTime() - gracePeriodDays * 86400000);
  return prisma.subscription.findFirst({
    where: { merchantId, status: "PAID", startsAt: { lte: now }, endsAt: { gte: limit } },
    orderBy: { endsAt: "desc" },
  });
}

/**
 * Applique la règle d'abonnement :
 *  - les établissements des commerçants sans abonnement payé sont bloqués
 *    (motif SUBSCRIPTION_UNPAID) ;
 *  - ceux bloqués pour ce motif sont débloqués dès qu'un abonnement est payé.
 * Les blocages manuels de l'admin (autre motif) ne sont jamais levés ici.
 */
export async function enforceForMerchant(merchantId: string, now = new Date()) {
  const settings = await getSettings();
  const sub = await activeSubscription(merchantId, now);
  if (!sub && settings.autoBlock) {
    const r = await prisma.venue.updateMany({
      where: { ownerId: merchantId, status: { not: "BLOCKED" } },
      data: { status: "BLOCKED", blockReason: SUBSCRIPTION_BLOCK_REASON },
    });
    return { blocked: r.count, unblocked: 0 };
  }
  if (sub || !settings.autoBlock) {
    const r = await prisma.venue.updateMany({
      where: { ownerId: merchantId, status: "BLOCKED", blockReason: SUBSCRIPTION_BLOCK_REASON },
      data: { status: "ACTIVE", blockReason: null },
    });
    return { blocked: 0, unblocked: r.count };
  }
  return { blocked: 0, unblocked: 0 };
}

export async function enforceSubscriptions(now = new Date()) {
  const merchants = await prisma.user.findMany({ where: { role: "MERCHANT" }, select: { id: true } });
  let blocked = 0;
  let unblocked = 0;
  for (const m of merchants) {
    const r = await enforceForMerchant(m.id, now);
    blocked += r.blocked;
    unblocked += r.unblocked;
  }
  return { blocked, unblocked };
}
