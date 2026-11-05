"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/auth";
import { addPoints } from "@/lib/points";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";
import type { FormState } from "./auth";

export async function toggleFavorite(venueId: string) {
  const user = await assertUser();
  const key = { userId_venueId: { userId: user.id, venueId } };
  const existing = await prisma.favorite.findUnique({ where: key });
  if (existing) await prisma.favorite.delete({ where: key });
  else await prisma.favorite.create({ data: { userId: user.id, venueId } });
  revalidatePath(`/venues/${venueId}`);
  revalidatePath("/me");
}

const reviewSchema = z.object({
  venueId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export async function submitReview(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  let user;
  try { user = await assertUser(); } catch { return { error: t("venue.loginToReview") }; }
  const parsed = reviewSchema.safeParse({ venueId: form.get("venueId"), rating: form.get("rating"), comment: form.get("comment") || undefined });
  if (!parsed.success) return { error: t("auth.invalidForm") };
  const { venueId, rating, comment } = parsed.data;
  const venue = await prisma.venue.findUnique({ where: { id: venueId } });
  if (!venue || venue.ownerId === user.id) return { error: t("common.error") };

  const settings = await getSettings();
  await prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({ where: { userId_venueId: { userId: user.id, venueId } } });
    if (existing) {
      await tx.review.update({ where: { id: existing.id }, data: { rating, comment } });
    } else {
      await tx.review.create({ data: { userId: user.id, venueId, rating, comment } });
      await addPoints(user.id, settings.reviewPoints, "REVIEW", venue.name, tx);
    }
  });
  revalidatePath(`/venues/${venueId}`);
  return { ok: t("common.saved") };
}
