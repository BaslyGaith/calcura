"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/auth";
import { addPoints, generateVoucherCode } from "@/lib/points";
import { getSettings } from "@/lib/settings";
import { visibleVenueWhere } from "@/lib/venues";
import { getT } from "@/lib/i18n/server";

export type RedeemResult = { ok: true; code: string } | { ok: false; error: string };

export async function redeemOffer(offerId: string): Promise<RedeemResult> {
  const { t } = getT();
  let user;
  try { user = await assertUser(["USER", "ADMIN"]); } catch { return { ok: false, error: t("games.loginToPlay") }; }
  const settings = await getSettings();
  try {
    const code = await prisma.$transaction(async (tx) => {
      const offer = await tx.offer.findFirst({
        where: { id: offerId, active: true, venue: visibleVenueWhere, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        include: { venue: true },
      });
      if (!offer) throw new Error(t("common.error"));
      if (offer.stock <= 0) throw new Error(t("rewards.outOfStock"));
      // Débit conditionnel : échoue si le solde est insuffisant (pas de solde négatif possible).
      const debit = await tx.user.updateMany({ where: { id: user.id, points: { gte: offer.pointsCost } }, data: { points: { decrement: offer.pointsCost } } });
      if (debit.count === 0) throw new Error(t("rewards.notEnough"));
      const stock = await tx.offer.updateMany({ where: { id: offer.id, stock: { gt: 0 } }, data: { stock: { decrement: 1 } } });
      if (stock.count === 0) throw new Error(t("rewards.outOfStock"));
      await tx.pointTransaction.create({ data: { userId: user.id, amount: -offer.pointsCost, reason: "VOUCHER", detail: `${offer.title} — ${offer.venue.name}` } });
      const code = generateVoucherCode();
      const expiry = new Date(Date.now() + settings.voucherValidityDays * 86400000);
      await tx.voucher.create({
        data: { code, userId: user.id, offerId: offer.id, pointsPaid: offer.pointsCost, expiresAt: offer.expiresAt && offer.expiresAt < expiry ? offer.expiresAt : expiry },
      });
      return code;
    });
    revalidatePath("/rewards");
    revalidatePath("/me");
    return { ok: true, code };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : t("common.error") };
  }
}

/** Annule un bon non utilisé et rembourse les points. */
export async function cancelVoucher(voucherId: string) {
  const user = await assertUser();
  await prisma.$transaction(async (tx) => {
    const v = await tx.voucher.findFirst({ where: { id: voucherId, userId: user.id, status: "ISSUED" }, include: { offer: true } });
    if (!v) return;
    await tx.voucher.update({ where: { id: v.id }, data: { status: "CANCELLED" } });
    await tx.offer.update({ where: { id: v.offerId }, data: { stock: { increment: 1 } } });
    await addPoints(user.id, v.pointsPaid, "REFUND", v.offer.title, tx);
  });
  revalidatePath("/me");
}
