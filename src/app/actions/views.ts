"use server";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isBot, recordView } from "@/lib/views";

const VISITOR_COOKIE = "bp_vid";

/** Appelée par la fiche établissement une fois affichée dans le navigateur (pas par les préchargements ni les robots). */
export async function trackVenueView(venueId: string, fromQuiz: boolean) {
  if (isBot(headers().get("user-agent"))) return;
  const user = await getCurrentUser();
  const venue = await prisma.venue.findUnique({ where: { id: venueId }, select: { ownerId: true } });
  if (!venue) return;
  // Les vues du propriétaire et des administrateurs ne comptent pas.
  if (user && (user.role === "ADMIN" || user.id === venue.ownerId)) return;

  let visitorId = user?.id;
  if (!visitorId) {
    visitorId = cookies().get(VISITOR_COOKIE)?.value;
    if (!visitorId || !/^[a-f0-9-]{36}$/.test(visitorId)) {
      visitorId = crypto.randomUUID();
      cookies().set(VISITOR_COOKIE, visitorId, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
    }
    visitorId = `anon:${visitorId}`;
  }
  await recordView(venueId, visitorId, "PAGE");
  if (fromQuiz) await recordView(venueId, visitorId, "QUIZ_CLICK");
}
