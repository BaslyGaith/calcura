"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { assertUser, type CurrentUser } from "@/lib/auth";
import { enforceForMerchant } from "@/lib/subscriptions";
import { getSettings } from "@/lib/settings";
import { FEATURES } from "@/lib/venues";
import { isInTunisia, nearestBy } from "@/lib/geo";
import { getT } from "@/lib/i18n/server";
import type { FormState } from "./auth";

/** Commerçant connecté. Un commerçant bloqué par l'admin ne peut rien modifier. */
async function merchant(): Promise<CurrentUser> {
  return assertUser(["MERCHANT"]);
}

async function ownVenue(user: CurrentUser, venueId: string) {
  const v = await prisma.venue.findFirst({ where: { id: venueId, ownerId: user.id } });
  if (!v) throw new Error("FORBIDDEN");
  return v;
}

const optional = z.string().trim().max(500).optional().transform((v) => (v ? v : null));

const venueSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["CAFE", "RESTAURANT"]),
  description: z.string().trim().max(2000).optional().transform((v) => (v ? v : null)),
  cuisine: optional,
  address: optional,
  city: optional,
  phone: optional,
  website: z.string().trim().url().max(300).optional().or(z.literal("")).transform((v) => (v ? v : null)),
  openingHours: optional,
  coverImage: optional,
  priceLevel: z.coerce.number().int().min(1).max(4),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
});

function readVenueForm(form: FormData) {
  return venueSchema.safeParse({
    name: form.get("name"),
    type: form.get("type"),
    description: form.get("description") || undefined,
    cuisine: form.get("cuisine") || undefined,
    address: form.get("address") || undefined,
    city: form.get("city") || undefined,
    phone: form.get("phone") || undefined,
    website: form.get("website") || "",
    openingHours: form.get("openingHours") || undefined,
    coverImage: form.get("coverImage") || undefined,
    priceLevel: form.get("priceLevel") || 2,
    lat: form.get("posLat"),
    lng: form.get("posLng"),
  });
}

function readFeatures(form: FormData) {
  return FEATURES.filter((f) => form.get(`feature_${f}`) === "on").join(",") || null;
}

export async function saveVenue(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  let user;
  try { user = await merchant(); } catch { return { error: t("common.error") }; }
  const parsed = readVenueForm(form);
  if (!parsed.success || !isInTunisia(parsed.data.lat, parsed.data.lng)) return { error: t("auth.invalidForm") };
  const d = parsed.data;
  const govs = await prisma.governorate.findMany();
  const govId = String(form.get("governorateId") || "") || nearestBy(govs, d.lat, d.lng).id;
  const data = { ...d, features: readFeatures(form), governorateId: govId };
  const id = String(form.get("id") || "");

  let venueId: string;
  if (id) {
    await ownVenue(user, id);
    await prisma.venue.update({ where: { id }, data });
    venueId = id;
  } else {
    const v = await prisma.venue.create({ data: { ...data, ownerId: user.id, source: "MERCHANT", status: "ACTIVE" } });
    venueId = v.id;
    await enforceForMerchant(user.id); // sans abonnement payé, le nouvel établissement est masqué
  }
  revalidatePath("/merchant");
  if (!id) redirect(`/merchant/venues/${venueId}`);
  revalidatePath(`/merchant/venues/${venueId}`);
  return { ok: t("common.saved") };
}

const ALLOWED_IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const MAX_UPLOAD = 5 * 1024 * 1024;

export async function addPhoto(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  let user;
  try { user = await merchant(); } catch { return { error: t("common.error") }; }
  const venueId = String(form.get("venueId"));
  try { await ownVenue(user, venueId); } catch { return { error: t("common.error") }; }
  const kind = form.get("kind") === "MENU" ? "MENU" : "PLACE";
  const caption = String(form.get("caption") ?? "").trim().slice(0, 200) || null;
  const file = form.get("file");
  let url = String(form.get("url") ?? "").trim();

  if (file instanceof File && file.size > 0) {
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext || file.size > MAX_UPLOAD) return { error: t("auth.invalidForm") };
    // Stockage local (public/uploads). En production, remplacez par un stockage objet (S3, Cloudinary…).
    const dir = path.join(process.cwd(), "public", "uploads", venueId);
    await mkdir(dir, { recursive: true });
    const name = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    url = `/uploads/${venueId}/${name}`;
  } else if (!/^https?:\/\/\S+$/i.test(url)) {
    return { error: t("auth.invalidForm") };
  }
  await prisma.photo.create({ data: { venueId, url, kind, caption } });
  revalidatePath(`/merchant/venues/${venueId}`);
  revalidatePath(`/venues/${venueId}`);
  return { ok: t("common.saved") };
}

export async function deletePhoto(photoId: string) {
  const user = await merchant();
  const p = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!p) return;
  await ownVenue(user, p.venueId);
  await prisma.photo.delete({ where: { id: photoId } });
  revalidatePath(`/merchant/venues/${p.venueId}`);
}

const itemSchema = z.object({
  venueId: z.string().min(1),
  category: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300).optional(),
  price: z.coerce.number().min(0).max(100000),
});

export async function addMenuItem(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  let user;
  try { user = await merchant(); } catch { return { error: t("common.error") }; }
  const parsed = itemSchema.safeParse({
    venueId: form.get("venueId"), category: form.get("category"), name: form.get("name"),
    description: form.get("description") || undefined, price: form.get("price"),
  });
  if (!parsed.success) return { error: t("auth.invalidForm") };
  try { await ownVenue(user, parsed.data.venueId); } catch { return { error: t("common.error") }; }
  await prisma.menuItem.create({ data: parsed.data });
  revalidatePath(`/merchant/venues/${parsed.data.venueId}`);
  return { ok: t("common.saved") };
}

export async function deleteMenuItem(itemId: string) {
  const user = await merchant();
  const it = await prisma.menuItem.findUnique({ where: { id: itemId } });
  if (!it) return;
  await ownVenue(user, it.venueId);
  await prisma.menuItem.delete({ where: { id: itemId } });
  revalidatePath(`/merchant/venues/${it.venueId}`);
}

const offerSchema = z.object({
  venueId: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  pointsCost: z.coerce.number().int().min(1).max(100000),
  valueTnd: z.coerce.number().min(0).max(10000).optional(),
  stock: z.coerce.number().int().min(0).max(100000),
  expiresAt: z.string().optional(),
});

export async function addOffer(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  let user;
  try { user = await merchant(); } catch { return { error: t("common.error") }; }
  const parsed = offerSchema.safeParse({
    venueId: form.get("venueId"), title: form.get("title"), description: form.get("description") || undefined,
    pointsCost: form.get("pointsCost"), valueTnd: form.get("valueTnd") || undefined, stock: form.get("stock"),
    expiresAt: form.get("expiresAt") || undefined,
  });
  if (!parsed.success) return { error: t("auth.invalidForm") };
  try { await ownVenue(user, parsed.data.venueId); } catch { return { error: t("common.error") }; }
  const { expiresAt, ...rest } = parsed.data;
  await prisma.offer.create({ data: { ...rest, expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`) : null } });
  revalidatePath(`/merchant/venues/${parsed.data.venueId}`);
  return { ok: t("common.saved") };
}

export async function toggleOffer(offerId: string) {
  const user = await merchant();
  const o = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!o) return;
  await ownVenue(user, o.venueId);
  await prisma.offer.update({ where: { id: offerId }, data: { active: !o.active } });
  revalidatePath(`/merchant/venues/${o.venueId}`);
}

/** Validation d'un bon d'achat présenté par un client. */
export async function validateVoucher(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  let user;
  try { user = await merchant(); } catch { return { error: t("common.error") }; }
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const v = await prisma.voucher.findFirst({
    where: { code, status: "ISSUED", expiresAt: { gt: new Date() }, offer: { venue: { ownerId: user.id } } },
    include: { offer: true, user: { select: { name: true } } },
  });
  if (!v) return { error: t("merchant.invalidCode") };
  const r = await prisma.voucher.updateMany({ where: { id: v.id, status: "ISSUED" }, data: { status: "REDEEMED", redeemedAt: new Date() } });
  if (r.count === 0) return { error: t("merchant.invalidCode") };
  revalidatePath("/merchant");
  return { ok: t("merchant.validated", { title: v.offer.title, user: v.user.name }) };
}

/** Le commerçant demande un abonnement ; l'admin le marquera « payé » à réception du paiement. */
export async function requestSubscription(plan: "MONTHLY" | "YEARLY") {
  const user = await assertUser(["MERCHANT"]).catch(async () => {
    // Un commerçant bloqué peut quand même demander à régulariser.
    const { getCurrentUser } = await import("@/lib/auth");
    const u = await getCurrentUser();
    if (!u || u.role !== "MERCHANT") throw new Error("FORBIDDEN");
    return u;
  });
  const settings = await getSettings();
  const pending = await prisma.subscription.findFirst({ where: { merchantId: user.id, status: "UNPAID" } });
  if (pending) return;
  const start = new Date();
  const end = new Date(start);
  if (plan === "YEARLY") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  await prisma.subscription.create({
    data: { merchantId: user.id, plan, amountTnd: plan === "YEARLY" ? settings.subscriptionYearly : settings.subscriptionMonthly, startsAt: start, endsAt: end, status: "UNPAID" },
  });
  revalidatePath("/merchant");
}
