import { prisma } from "./db";
import { getSettings } from "./settings";
import { visibleVenueWhere } from "./venues";
import { pickVenues } from "./menu-quiz";

/**
 * Choisit une photo de menu d'un établissement visible pour le puzzle.
 * Les établissements de commerçants abonnés sont favorisés (même poids que le quiz).
 */
export async function pickPuzzlePhoto() {
  const settings = await getSettings();
  const grouped = await prisma.photo.groupBy({ by: ["venueId"], where: { kind: "MENU", venue: visibleVenueWhere } });
  if (grouped.length === 0) return null;
  const light = await prisma.venue.findMany({ where: { id: { in: grouped.map((g) => g.venueId) } }, select: { id: true, ownerId: true } });
  const [chosen] = pickVenues(light.map((v) => ({ id: v.id, sponsored: !!v.ownerId })), 1, settings.quizSponsoredWeight);
  if (!chosen) return null;
  const venue = await prisma.venue.findUnique({
    where: { id: chosen.id },
    include: { photos: { where: { kind: "MENU" } } },
  });
  if (!venue || venue.photos.length === 0) return null;
  const photo = venue.photos[Math.floor(Math.random() * venue.photos.length)];
  return { url: photo.url, venue: { id: venue.id, name: venue.name, city: venue.city, type: venue.type } };
}
