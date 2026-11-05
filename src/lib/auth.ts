import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

export type Role = "USER" | "MERCHANT" | "ADMIN";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export async function checkPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(user: { id: string; role: string }) {
  const token = await signSession({ sub: user.id, role: user.role });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export function destroySession() {
  cookies().delete(SESSION_COOKIE);
}

/** Utilisateur connecté (relu en base à chaque requête : un blocage prend effet immédiatement). */
export async function getCurrentUser() {
  const session = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) return null;
  return user;
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** Exige une connexion (et éventuellement un rôle). Les comptes bloqués sont refusés. */
export async function requireUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "BLOCKED" && user.role !== "MERCHANT") {
    destroySession();
    redirect("/login?blocked=1");
  }
  if (roles && !roles.includes(user.role as Role)) redirect("/");
  return user;
}

/** Variante pour les actions serveur : lève une erreur au lieu de rediriger. */
export async function assertUser(roles?: Role[]): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  if (user.status === "BLOCKED") throw new Error("BLOCKED");
  if (roles && !roles.includes(user.role as Role)) throw new Error("FORBIDDEN");
  return user;
}
