"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkPassword, createSession, destroySession, hashPassword } from "@/lib/auth";
import { addPoints, generateReferralCode } from "@/lib/points";
import { getSettings } from "@/lib/settings";
import { getT } from "@/lib/i18n/server";

export type FormState = { error?: string; ok?: string } | undefined;

function homeFor(role: string) {
  return role === "ADMIN" ? "/admin" : role === "MERCHANT" ? "/merchant" : "/";
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await checkPassword(password, user.passwordHash))) return { error: t("auth.invalid") };
  // Un commerçant bloqué peut se connecter pour voir le motif et régulariser son abonnement.
  if (user.status === "BLOCKED" && user.role !== "MERCHANT") {
    return { error: t("auth.blocked", { reason: user.blockReason ?? "—" }) };
  }
  await createSession(user);
  redirect(homeFor(user.role));
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(200),
  role: z.enum(["USER", "MERCHANT"]),
  phone: z.string().trim().max(30).optional(),
  referral: z.string().trim().toUpperCase().max(20).optional(),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const { t } = getT();
  const parsed = registerSchema.safeParse({
    name: form.get("name"),
    email: form.get("email"),
    password: form.get("password"),
    role: form.get("role") ?? "USER",
    phone: form.get("phone") || undefined,
    referral: form.get("referral") || undefined,
  });
  if (!parsed.success) {
    const pw = parsed.error.issues.some((i) => i.path[0] === "password");
    return { error: pw ? t("auth.weakPassword") : t("auth.invalidForm") };
  }
  const d = parsed.data;
  if (await prisma.user.findUnique({ where: { email: d.email } })) return { error: t("auth.emailTaken") };

  const settings = await getSettings();
  const referrer = d.referral ? await prisma.user.findUnique({ where: { referralCode: d.referral } }) : null;

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        name: d.name,
        email: d.email,
        phone: d.phone,
        passwordHash: await hashPassword(d.password),
        role: d.role,
        referralCode: generateReferralCode(d.name),
        referredById: referrer?.id,
      },
    });
    if (d.role === "USER") await addPoints(u.id, settings.signupPoints, "SIGNUP", undefined, tx);
    if (referrer && d.role === "USER") await addPoints(referrer.id, settings.referralPoints, "REFERRAL", u.name, tx);
    return u;
  });

  await createSession(user);
  redirect(homeFor(user.role));
}

export async function logout() {
  destroySession();
  redirect("/");
}
