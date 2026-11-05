import { prisma } from "./db";
import { getSettings } from "./settings";
import { visibleVenueWhere } from "./venues";
import { pickQuiz, QUIZ_LENGTH } from "./games";
import { MENU_QUESTION_ID_BASE, pickVenues, questionFor, type MenuQuizVenue } from "./menu-quiz";

export type ClientQuizQuestion = {
  id: number;
  q: string;
  options: string[];
  venue?: { id: string; name: string; city: string | null; image: string | null };
};

const MIN_MENU_ITEMS = 4;

/**
 * Compose un quiz de QUIZ_LENGTH questions : jusqu'à `quizMenuQuestions` questions sur les
 * menus d'établissements visibles (commerçants abonnés favorisés), complétées par des
 * questions de culture tunisienne.
 */
export async function buildQuiz(locale: "fr" | "en") {
  const settings = await getSettings();
  const wanted = Math.min(QUIZ_LENGTH, Math.max(0, Math.floor(settings.quizMenuQuestions)));
  const questions: ClientQuizQuestion[] = [];
  const key: Record<number, number> = {};

  if (wanted > 0) {
    // Candidats légers : établissements visibles ayant un menu suffisant.
    const grouped = await prisma.menuItem.groupBy({ by: ["venueId"], where: { available: true, venue: visibleVenueWhere }, _count: { _all: true } });
    const eligibleIds = grouped.filter((g) => g._count._all >= MIN_MENU_ITEMS).map((g) => g.venueId);
    const light = await prisma.venue.findMany({ where: { id: { in: eligibleIds } }, select: { id: true, ownerId: true } });
    // Un établissement visible et rattaché à un commerçant a un abonnement à jour (blocage automatique sinon).
    const chosen = pickVenues(light.map((v) => ({ id: v.id, sponsored: !!v.ownerId })), wanted, settings.quizSponsoredWeight);

    if (chosen.length) {
      const [venues, others, govs] = await Promise.all([
        prisma.venue.findMany({
          where: { id: { in: chosen.map((c) => c.id) } },
          include: { governorate: true, menuItems: { where: { available: true } }, photos: { where: { kind: "PLACE" }, take: 1 } },
        }),
        prisma.menuItem.findMany({ select: { name: true }, distinct: ["name"], take: 300 }),
        prisma.governorate.findMany({ select: { nameFr: true, nameEn: true } }),
      ]);
      const byId = new Map(venues.map((v) => [v.id, v]));
      const otherNames = others.map((o) => o.name);
      const govNames = govs.map((g) => ({ fr: g.nameFr, en: g.nameEn }));
      chosen.forEach((c, i) => {
        const v = byId.get(c.id);
        if (!v) return;
        const mv: MenuQuizVenue = {
          id: v.id, name: v.name, city: v.city, sponsored: c.sponsored,
          governorate: { fr: v.governorate.nameFr, en: v.governorate.nameEn },
          image: v.coverImage ?? v.photos[0]?.url ?? null,
          items: v.menuItems.map((m) => ({ name: m.name, price: m.price, category: m.category })),
        };
        const q = questionFor(mv, MENU_QUESTION_ID_BASE + i, locale, otherNames, govNames);
        if (q) {
          key[q.id] = q.answer;
          questions.push({ id: q.id, q: q.q, options: q.options, venue: q.venue });
        }
      });
    }
  }

  const culture = pickQuiz(locale, QUIZ_LENGTH - questions.length);
  Object.assign(key, culture.key);
  // Questions « menu » et « culture » mélangées.
  const all: ClientQuizQuestion[] = [...questions, ...culture.questions].sort(() => Math.random() - 0.5);
  return { questions: all, key };
}
