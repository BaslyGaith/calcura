import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

type Tx = Prisma.TransactionClient;

/** Crédite (ou débite si négatif) des points et journalise la transaction. */
export async function addPoints(
  userId: string,
  amount: number,
  reason: string,
  detail?: string,
  tx: Tx = prisma,
) {
  if (amount === 0) return;
  await tx.user.update({ where: { id: userId }, data: { points: { increment: amount } } });
  await tx.pointTransaction.create({ data: { userId, amount, reason, detail } });
}

export function startOfToday(now = new Date()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Code de bon d'achat lisible, sans caractères ambigus (0/O, 1/I). */
export function generateVoucherCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return `BP-${chars.slice(0, 4)}-${chars.slice(4)}`;
}

export function generateReferralCode(name: string): string {
  const base = name.normalize("NFD").replace(/[^A-Za-z]/g, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  const n = crypto.getRandomValues(new Uint16Array(1))[0] % 10000;
  return `${base}${String(n).padStart(4, "0")}`;
}
