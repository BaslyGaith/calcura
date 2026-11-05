// Questions de quiz générées à partir des menus réels des cafés et restaurants.
// Objectif : donner de la visibilité aux établissements — chaque question affiche
// l'établissement et un lien « Voir le menu » pour trouver la réponse.

export type MenuQuizVenue = {
  id: string;
  name: string;
  city: string | null;
  governorate: { fr: string; en: string };
  image: string | null;
  sponsored: boolean; // établissement d'un commerçant abonné : plus de chances d'apparaître
  items: { name: string; price: number; category: string }[];
};

export type MenuQuestion = {
  id: number;
  q: string;
  options: string[];
  answer: number;
  venue: { id: string; name: string; city: string | null; image: string | null };
};

type Locale = "fr" | "en";

const FALLBACK_DISTRACTORS = [
  "Sushi saumon", "Fondue savoyarde", "Tacos al pastor", "Paella valenciana", "Bubble tea", "Ramen tonkotsu",
  "Fish and chips", "Croque-monsieur", "Hot-dog new-yorkais", "Pad thaï", "Burrito", "Moussaka", "Bagel saumon", "Gaufre liégeoise",
];

const T = {
  onMenu: {
    fr: (v: string) => `Lequel de ces articles figure au menu de « ${v} » ?`,
    en: (v: string) => `Which of these items is on the menu at "${v}"?`,
  },
  price: {
    fr: (item: string, v: string) => `Combien coûte « ${item} » chez « ${v} » ?`,
    en: (item: string, v: string) => `How much does "${item}" cost at "${v}"?`,
  },
  cheapest: {
    fr: (cat: string, v: string) => `Quel est l'article le moins cher de la catégorie « ${cat} » chez « ${v} » ?`,
    en: (cat: string, v: string) => `What is the cheapest item in the "${cat}" category at "${v}"?`,
  },
  gov: {
    fr: (v: string) => `Dans quel gouvernorat se trouve « ${v} » ?`,
    en: (v: string) => `In which governorate is "${v}"?`,
  },
};

type Rng = () => number;

export function shuffleWith<T>(arr: readonly T[], rand: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tirage pondéré sans remise : les établissements sponsorisés pèsent `sponsoredWeight` fois plus. */
export function pickVenues<V extends { sponsored: boolean }>(venues: V[], n: number, sponsoredWeight: number, rand: Rng = Math.random): V[] {
  const pool = [...venues];
  const out: V[] = [];
  while (out.length < n && pool.length) {
    const weights = pool.map((v) => (v.sponsored ? Math.max(1, sponsoredWeight) : 1));
    let r = rand() * weights.reduce((a, b) => a + b, 0);
    let idx = 0;
    while (idx < pool.length - 1 && r >= weights[idx]) r -= weights[idx++];
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}

export function formatPrice(p: number, locale: Locale) {
  return `${p.toFixed(3)} ${locale === "en" ? "TND" : "DT"}`;
}

/** Prix plausibles mais faux, distincts du vrai prix et entre eux. */
export function priceDistractors(price: number, rand: Rng = Math.random): number[] {
  const factors = shuffleWith([0.5, 0.7, 1.3, 1.5, 1.8, 2.2], rand);
  const out: number[] = [];
  for (const f of factors) {
    let p = Math.round(price * f * 2) / 2; // arrondi au demi-dinar
    if (p <= 0) p = 0.5;
    if (Math.abs(p - price) > 0.001 && !out.some((x) => Math.abs(x - p) < 0.001)) out.push(p);
    if (out.length === 3) break;
  }
  let extra = 1;
  while (out.length < 3) {
    const p = price + extra++;
    if (!out.includes(p)) out.push(p);
  }
  return out;
}

function build(id: number, q: string, correct: string, wrong: string[], venue: MenuQuizVenue, rand: Rng): MenuQuestion {
  const options = shuffleWith([correct, ...wrong.slice(0, 3)], rand);
  return { id, q, options, answer: options.indexOf(correct), venue: { id: venue.id, name: venue.name, city: venue.city, image: venue.image } };
}

/**
 * Construit une question à partir d'un établissement. `otherItems` sert de réservoir
 * de mauvaises réponses (articles d'autres menus), `governorates` pour la question de lieu.
 */
export function questionFor(
  venue: MenuQuizVenue,
  id: number,
  locale: Locale,
  otherItems: string[],
  governorates: { fr: string; en: string }[],
  rand: Rng = Math.random,
): MenuQuestion | null {
  const own = new Set(venue.items.map((i) => i.name.toLowerCase()));
  const kinds = shuffleWith(["onMenu", "price", "cheapest", "gov"] as const, rand);
  for (const kind of kinds) {
    if (kind === "onMenu" && venue.items.length >= 1) {
      const pool = Array.from(new Set([...otherItems, ...FALLBACK_DISTRACTORS])).filter((n) => !own.has(n.toLowerCase()));
      if (pool.length < 3) continue;
      const item = venue.items[Math.floor(rand() * venue.items.length)];
      return build(id, T.onMenu[locale](venue.name), item.name, shuffleWith(pool, rand), venue, rand);
    }
    if (kind === "price" && venue.items.length >= 1) {
      const item = venue.items[Math.floor(rand() * venue.items.length)];
      const wrong = priceDistractors(item.price, rand).map((p) => formatPrice(p, locale));
      return build(id, T.price[locale](item.name, venue.name), formatPrice(item.price, locale), wrong, venue, rand);
    }
    if (kind === "cheapest") {
      const byCat = new Map<string, MenuQuizVenue["items"]>();
      for (const it of venue.items) byCat.set(it.category, [...(byCat.get(it.category) ?? []), it]);
      const cats = shuffleWith(
        [...byCat.entries()].filter(([, its]) => {
          if (its.length < 4) return false;
          const min = Math.min(...its.map((i) => i.price));
          return its.filter((i) => i.price === min).length === 1; // une seule bonne réponse
        }),
        rand,
      );
      if (!cats.length) continue;
      const [cat, its] = cats[0];
      const sorted = [...its].sort((a, b) => a.price - b.price);
      return build(id, T.cheapest[locale](cat, venue.name), sorted[0].name, shuffleWith(sorted.slice(1).map((i) => i.name), rand), venue, rand);
    }
    if (kind === "gov" && governorates.length >= 4) {
      const correct = venue.governorate[locale];
      // Trop facile si le nom ou la ville affichée contient déjà le gouvernorat.
      const visible = `${venue.name} ${venue.city ?? ""}`.toLowerCase();
      if (visible.includes(venue.governorate.fr.toLowerCase()) || visible.includes(venue.governorate.en.toLowerCase())) continue;
      const wrong = shuffleWith(governorates.map((g) => g[locale]).filter((g) => g !== correct), rand);
      return build(id, T.gov[locale](venue.name), correct, wrong, venue, rand);
    }
  }
  return null;
}

export const MENU_QUESTION_ID_BASE = 1000;
