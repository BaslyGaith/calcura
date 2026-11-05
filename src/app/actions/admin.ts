"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { assertUser } from "@/lib/auth";
import { addPoints } from "@/lib/points";
import { DEFAULT_SETTINGS, SETTING_KEYS, setSetting } from "@/lib/settings";
import { enforceForMerchant, enforceSubscriptions } from "@/lib/subscriptions";

async function admin() {
  return assertUser(["ADMIN"]);
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function done(path: string) {
  revalidatePath(path);
  revalidatePath("/admin");
}

// ---------- Utilisateurs & commerçants ----------
export async function setUserStatus(form: FormData) {
  const me = await admin();
  const id = str(form, "id");
  const status = str(form, "status") === "BLOCKED" ? "BLOCKED" : "ACTIVE";
  if (id === me.id) return; // l'admin ne peut pas se bloquer lui-même
  const reason = str(form, "reason") || null;
  const user = await prisma.user.update({ where: { id }, data: { status, blockReason: status === "BLOCKED" ? reason : null } });
  // Bloquer un commerçant masque aussi tous ses établissements (via visibleVenueWhere).
  done(user.role === "MERCHANT" ? "/admin/merchants" : "/admin/users");
}

export async function setUserRole(form: FormData) {
  const me = await admin();
  const id = str(form, "id");
  const role = str(form, "role");
  if (id === me.id || !["USER", "MERCHANT", "ADMIN"].includes(role)) return;
  await prisma.user.update({ where: { id }, data: { role } });
  done("/admin/users");
}

export async function adjustPoints(form: FormData) {
  await admin();
  const id = str(form, "id");
  const amount = Math.trunc(Number(str(form, "amount")));
  if (!Number.isFinite(amount) || amount === 0) return;
  const detail = str(form, "detail") || undefined;
  await prisma.$transaction(async (tx) => {
    const u = await tx.user.findUniqueOrThrow({ where: { id } });
    // Pas de solde négatif.
    const delta = Math.max(amount, -u.points);
    await addPoints(id, delta, "ADMIN", detail, tx);
  });
  done("/admin/users");
}

// ---------- Établissements ----------
export async function setVenueStatus(form: FormData) {
  await admin();
  const id = str(form, "id");
  const status = str(form, "status") === "BLOCKED" ? "BLOCKED" : "ACTIVE";
  await prisma.venue.update({ where: { id }, data: { status, blockReason: status === "BLOCKED" ? str(form, "reason") || "ADMIN" : null } });
  revalidatePath(`/venues/${id}`);
  done("/admin/venues");
}

export async function toggleFeatured(form: FormData) {
  await admin();
  const id = str(form, "id");
  const v = await prisma.venue.findUniqueOrThrow({ where: { id } });
  await prisma.venue.update({ where: { id }, data: { featured: !v.featured } });
  done("/admin/venues");
}

/** Rattache un établissement (ex. importé d'OSM) au compte d'un commerçant. */
export async function assignOwner(form: FormData) {
  await admin();
  const id = str(form, "id");
  const email = str(form, "email").toLowerCase();
  if (!email) {
    await prisma.venue.update({ where: { id }, data: { ownerId: null } });
  } else {
    const m = await prisma.user.findFirst({ where: { email, role: "MERCHANT" } });
    if (!m) return;
    await prisma.venue.update({ where: { id }, data: { ownerId: m.id } });
    await enforceForMerchant(m.id);
  }
  done("/admin/venues");
}

export async function deleteVenue(form: FormData) {
  await admin();
  await prisma.venue.delete({ where: { id: str(form, "id") } });
  done("/admin/venues");
}

// ---------- Abonnements ----------
export async function createSubscription(form: FormData) {
  await admin();
  const merchantId = str(form, "merchantId");
  const plan = str(form, "plan") === "YEARLY" ? "YEARLY" : "MONTHLY";
  const amount = Number(str(form, "amount"));
  const paid = str(form, "paid") === "on";
  const start = str(form, "startsAt") ? new Date(str(form, "startsAt")) : new Date();
  const end = new Date(start);
  if (plan === "YEARLY") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  await prisma.subscription.create({
    data: { merchantId, plan, amountTnd: Number.isFinite(amount) ? amount : 0, startsAt: start, endsAt: end, status: paid ? "PAID" : "UNPAID", paidAt: paid ? new Date() : null, note: str(form, "note") || null },
  });
  await enforceForMerchant(merchantId);
  done("/admin/merchants");
}

export async function setSubscriptionStatus(form: FormData) {
  await admin();
  const id = str(form, "id");
  const status = str(form, "status");
  if (!["PAID", "UNPAID", "CANCELLED"].includes(status)) return;
  const s = await prisma.subscription.update({ where: { id }, data: { status, paidAt: status === "PAID" ? new Date() : null } });
  await enforceForMerchant(s.merchantId);
  done("/admin/merchants");
}

export async function runEnforcement() {
  await admin();
  const r = await enforceSubscriptions();
  revalidatePath("/admin");
  redirect(`/admin?enforced=${r.blocked}`);
}

// ---------- Avis ----------
export async function toggleReview(form: FormData) {
  await admin();
  const id = str(form, "id");
  const r = await prisma.review.findUniqueOrThrow({ where: { id } });
  await prisma.review.update({ where: { id }, data: { hidden: !r.hidden } });
  revalidatePath(`/venues/${r.venueId}`);
  done("/admin/reviews");
}

// ---------- Paramètres ----------
export async function saveSettings(form: FormData) {
  await admin();
  for (const key of SETTING_KEYS) {
    const raw = str(form, key);
    if (raw === "") continue;
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 0) await setSetting(key, n);
    else await setSetting(key, DEFAULT_SETTINGS[key]);
  }
  await enforceSubscriptions(); // le blocage automatique peut avoir changé
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

// ---------- Tirages au sort ----------
export async function createDraw(form: FormData) {
  await admin();
  const title = str(form, "title");
  const prize = str(form, "prize");
  const endsAt = str(form, "endsAt");
  if (title.length < 2 || prize.length < 2 || !endsAt) return;
  const end = new Date(`${endsAt}T23:59:59`);
  if (Number.isNaN(end.getTime()) || end <= new Date()) return;
  const num = (k: string, d: number) => {
    const n = Number(str(form, k));
    return Number.isFinite(n) && n >= 0 ? n : d;
  };
  await prisma.draw.create({
    data: {
      title, prize,
      description: str(form, "description") || null,
      prizeValueTnd: str(form, "prizeValueTnd") ? num("prizeValueTnd", 0) : null,
      venueId: str(form, "venueId") || null,
      ticketCostPoints: Math.floor(num("ticketCostPoints", 0)),
      maxTicketsPerUser: Math.max(1, Math.floor(num("maxTicketsPerUser", 50))),
      startsAt: str(form, "startsAt") ? new Date(`${str(form, "startsAt")}T00:00:00`) : new Date(),
      endsAt: end,
    },
  });
  done("/admin/draws");
  revalidatePath("/draws");
}

export async function drawNow(form: FormData) {
  await admin();
  const { performDraw } = await import("@/lib/draws");
  try { await performDraw(str(form, "id")); } catch { /* déjà tiré */ }
  done("/admin/draws");
  revalidatePath("/draws");
}

export async function cancelDraw(form: FormData) {
  await admin();
  await prisma.draw.updateMany({ where: { id: str(form, "id"), status: "OPEN" }, data: { status: "CANCELLED" } });
  done("/admin/draws");
  revalidatePath("/draws");
}
