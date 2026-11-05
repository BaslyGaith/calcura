"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function setLocale(locale: string) {
  const l = locale === "en" ? "en" : "fr";
  cookies().set("locale", l, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const user = await getCurrentUser();
  if (user) await prisma.user.update({ where: { id: user.id }, data: { locale: l } });
  revalidatePath("/", "layout");
}
