import { prisma } from "./db";
import { getSettings } from "./settings";
import { visibleVenueWhere } from "./venues";
import { pickVenues } from "./menu-quiz";

const DRINK_CATEGORY = /boisson|drink|jus|juice|caf[ée]s?$|th[ée]s?$|eau|water/i;

export type PuzzlePhoto = {
  url: string;
  dish: { name: string; price: number; category: string; description: string | null } | null;
  venue: { id: string; name: string; city: string | null; type: string };
};

/**
 * Choisit l'image du puzzle : en priorité la photo d'un plat (pour mettre en valeur
 * l'offre de l'établissement), sinon une photo de menu. Les établissements de
 * commerçants abonnés sont favorisés.
 */
export async function pickPuzzlePhoto(): Promise<PuzzlePhoto | null> {
  const settings = await getSettings();
  const weight = settings.quizSponsoredWeight;

  // 1) Plats avec photo
  const dishVenues = await prisma.menuItem.groupBy({
    by: ["venueId"],
    where: { available: true, imageUrl: { not: null }, venue: visibleVenueWhere },
  });
  const pick = async (ids: string[]) => {
    const light = await prisma.venue.findMany({ where: { id: { in: ids } }, select: { id: true, ownerId: true } });
    return pickVenues(light.map((v) => ({ id: v.id, sponsored: !!v.ownerId })), 1, weight)[0] ?? null;
  };
  if (dishVenues.length) {
    const chosen = await pick(dishVenues.map((d) => d.venueId));
    if (chosen) {
      const venue = await prisma.venue.findUnique({
        where: { id: chosen.id },
        include: { menuItems: { where: { available: true, imageUrl: { not: null } } } },
      });
      if (venue && venue.menuItems.length) {
        // On met en avant les plats plutôt que les boissons quand il y en a.
        const food = venue.menuItems.filter((m) => !DRINK_CATEGORY.test(m.category));
        const pool = food.length ? food : venue.menuItems;
        const item = pool[Math.floor(Math.random() * pool.length)];
        return {
          url: item.imageUrl!,
          dish: { name: item.name, price: item.price, category: item.category, description: item.description },
          venue: { id: venue.id, name: venue.name, city: venue.city, type: venue.type },
        };
      }
    }
  }

  // 2) Repli : photo de menu
  const menuVenues = await prisma.photo.groupBy({ by: ["venueId"], where: { kind: "MENU", venue: visibleVenueWhere } });
  if (!menuVenues.length) return null;
  const chosen = await pick(menuVenues.map((g) => g.venueId));
  if (!chosen) return null;
  const venue = await prisma.venue.findUnique({ where: { id: chosen.id }, include: { photos: { where: { kind: "MENU" } } } });
  if (!venue || !venue.photos.length) return null;
  const photo = venue.photos[Math.floor(Math.random() * venue.photos.length)];
  return { url: photo.url, dish: null, venue: { id: venue.id, name: venue.name, city: venue.city, type: venue.type } };
}
