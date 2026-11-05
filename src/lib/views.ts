import { Prisma } from "@prisma/client";
import { prisma } from "./db";

export type ViewSource = "PAGE" | "GAME_SHOWN" | "GAME_CLICK";

export function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

/**
 * Enregistre une vue unique (1 par visiteur, par jour et par source).
 * Renvoie true si la vue est nouvelle. Les vues « PAGE » incrémentent aussi Venue.viewCount.
 */
export async function recordView(venueId: string, visitorId: string, source: ViewSource, now = new Date()): Promise<boolean> {
  try {
    await prisma.venueView.create({ data: { venueId, visitorId, source, day: dayKey(now) } });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && (e.code === "P2002" || e.code === "P2003")) return false;
    throw e;
  }
  if (source === "PAGE") await prisma.venue.update({ where: { id: venueId }, data: { viewCount: { increment: 1 } } });
  return true;
}

/** Statistiques de visibilité sur `days` jours pour un ensemble d'établissements. */
export async function viewStats(venueIds: string[], days = 30, now = new Date()) {
  const from = new Date(now.getTime() - (days - 1) * 86400000);
  const rows = venueIds.length
    ? await prisma.venueView.groupBy({
        by: ["venueId", "source", "day"],
        where: { venueId: { in: venueIds }, day: { gte: dayKey(from) } },
        _count: { _all: true },
      })
    : [];
  const dayList = Array.from({ length: days }, (_, i) => dayKey(new Date(from.getTime() + i * 86400000)));
  const empty = () => ({ PAGE: 0, GAME_SHOWN: 0, GAME_CLICK: 0 });
  const perVenue = new Map<string, Record<ViewSource, number>>(venueIds.map((id) => [id, empty()]));
  const perDay = new Map<string, number>(dayList.map((d) => [d, 0]));
  const totals = empty();
  for (const r of rows) {
    const src = r.source as ViewSource;
    const n = r._count._all;
    perVenue.get(r.venueId)![src] += n;
    totals[src] += n;
    if (src === "PAGE") perDay.set(r.day, (perDay.get(r.day) ?? 0) + n);
  }
  return { perVenue, totals, perDay: dayList.map((d) => ({ day: d, views: perDay.get(d) ?? 0 })) };
}

const BOT_UA = /bot|crawler|spider|slurp|facebookexternalhit|preview|lighthouse/i;
export function isBot(userAgent: string | null) {
  return !!userAgent && BOT_UA.test(userAgent);
}
