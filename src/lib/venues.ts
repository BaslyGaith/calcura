import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { distanceKm } from "./geo";

export const FEATURES = ["wifi", "terrasse", "parking", "climatisation", "famille", "livraison", "vue_mer", "non_fumeur", "match"] as const;
export type Feature = (typeof FEATURES)[number];

/** Un établissement est visible s'il est actif et que son propriétaire (s'il en a un) n'est pas bloqué. */
export const visibleVenueWhere: Prisma.VenueWhereInput = {
  status: "ACTIVE",
  OR: [{ ownerId: null }, { owner: { status: "ACTIVE" } }],
};

export type VenueFilters = {
  q?: string;
  type?: string;
  gov?: string;
  price?: number;
  feature?: string;
  sort?: "distance" | "rating" | "name" | "recent" | "popular";
  lat?: number;
  lng?: number;
  page?: number;
  perPage?: number;
};

export type VenueListItem = Awaited<ReturnType<typeof searchVenues>>["items"][number];

export async function searchVenues(f: VenueFilters) {
  const perPage = f.perPage ?? 24;
  const page = Math.max(1, f.page ?? 1);
  const and: Prisma.VenueWhereInput[] = [visibleVenueWhere];
  if (f.type === "CAFE" || f.type === "RESTAURANT") and.push({ type: f.type });
  if (f.gov) and.push({ governorate: { slug: f.gov } });
  if (f.price) and.push({ priceLevel: f.price });
  if (f.feature) and.push({ features: { contains: f.feature } });
  if (f.q) {
    const q = f.q.trim();
    and.push({ OR: [{ name: { contains: q } }, { city: { contains: q } }, { cuisine: { contains: q } }, { address: { contains: q } }, { governorate: { nameFr: { contains: q } } }] });
  }
  const where: Prisma.VenueWhereInput = { AND: and };
  const hasPos = typeof f.lat === "number" && typeof f.lng === "number" && Number.isFinite(f.lat) && Number.isFinite(f.lng);
  const sort = f.sort ?? (hasPos ? "distance" : "recent");

  // Tri calculé en mémoire (distance / note) : on récupère d'abord les identifiants.
  let pageIds: string[];
  let total: number;
  if ((sort === "distance" && hasPos) || sort === "rating") {
    const all = await prisma.venue.findMany({ where, select: { id: true, lat: true, lng: true, featured: true } });
    total = all.length;
    let ordered: { id: string }[];
    if (sort === "distance") {
      ordered = all
        .map((v) => ({ id: v.id, d: distanceKm(f.lat!, f.lng!, v.lat, v.lng) }))
        .sort((a, b) => a.d - b.d);
    } else {
      const ratings = await ratingMap(all.map((v) => v.id));
      ordered = all
        .map((v) => ({ id: v.id, r: ratings.get(v.id)?.avg ?? 0, c: ratings.get(v.id)?.count ?? 0 }))
        .sort((a, b) => b.r - a.r || b.c - a.c);
    }
    pageIds = ordered.slice((page - 1) * perPage, page * perPage).map((o) => o.id);
  } else {
    const orderBy: Prisma.VenueOrderByWithRelationInput[] =
      sort === "name" ? [{ name: "asc" }] : sort === "popular" ? [{ viewCount: "desc" }, { name: "asc" }] : [{ featured: "desc" }, { createdAt: "desc" }];
    const [rows, count] = await Promise.all([
      prisma.venue.findMany({ where, orderBy, select: { id: true }, skip: (page - 1) * perPage, take: perPage }),
      prisma.venue.count({ where }),
    ]);
    pageIds = rows.map((r) => r.id);
    total = count;
  }

  const venues = await prisma.venue.findMany({
    where: { id: { in: pageIds } },
    include: { governorate: true, photos: { where: { kind: "PLACE" }, take: 1 }, _count: { select: { offers: { where: { active: true } } } } },
  });
  const ratings = await ratingMap(pageIds);
  const byId = new Map(venues.map((v) => [v.id, v]));
  const items = pageIds
    .map((id) => byId.get(id))
    .filter((v): v is NonNullable<typeof v> => !!v)
    .map((v) => ({
      ...v,
      rating: ratings.get(v.id)?.avg ?? null,
      reviewCount: ratings.get(v.id)?.count ?? 0,
      distance: hasPos ? distanceKm(f.lat!, f.lng!, v.lat, v.lng) : null,
      image: v.coverImage ?? v.photos[0]?.url ?? null,
    }));
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}

export async function ratingMap(venueIds: string[]) {
  if (venueIds.length === 0) return new Map<string, { avg: number; count: number }>();
  const rows = await prisma.review.groupBy({
    by: ["venueId"],
    where: { venueId: { in: venueIds }, hidden: false },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.venueId, { avg: r._avg.rating ?? 0, count: r._count._all }]));
}

export function parseFeatures(s: string | null | undefined): Feature[] {
  if (!s) return [];
  return s.split(",").map((x) => x.trim()).filter((x): x is Feature => (FEATURES as readonly string[]).includes(x));
}

export type NearbyParams = {
  bounds: { n: number; s: number; e: number; w: number };
  ref: { lat: number; lng: number }; // point de référence pour la distance (position ou centre)
  type?: string;
  offers?: boolean;
  topRated?: boolean;
  q?: string;
  limit?: number;
};

/** Établissements visibles dans une zone de carte, triés du plus proche au plus loin. */
export async function nearbyVenues(p: NearbyParams) {
  const and: Prisma.VenueWhereInput[] = [
    visibleVenueWhere,
    { lat: { gte: p.bounds.s, lte: p.bounds.n }, lng: { gte: p.bounds.w, lte: p.bounds.e } },
  ];
  if (p.type === "CAFE" || p.type === "RESTAURANT") and.push({ type: p.type });
  if (p.offers) and.push({ offers: { some: { active: true, stock: { gt: 0 }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } } });
  if (p.q) and.push({ OR: [{ name: { contains: p.q } }, { cuisine: { contains: p.q } }, { city: { contains: p.q } }, { menuItems: { some: { name: { contains: p.q } } } }] });

  const light = await prisma.venue.findMany({ where: { AND: and }, select: { id: true, lat: true, lng: true } });
  const ratings = p.topRated ? await ratingMap(light.map((v) => v.id)) : null;
  const ordered = light
    .filter((v) => !ratings || (ratings.get(v.id)?.avg ?? 0) >= 4)
    .map((v) => ({ id: v.id, d: distanceKm(p.ref.lat, p.ref.lng, v.lat, v.lng) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, p.limit ?? 300);
  const ids = ordered.map((o) => o.id);
  const [rows, rmap] = await Promise.all([
    prisma.venue.findMany({
      where: { id: { in: ids } },
      select: {
        id: true, name: true, type: true, lat: true, lng: true, city: true, cuisine: true, priceLevel: true, coverImage: true, openingHours: true,
        photos: { where: { kind: "PLACE" }, take: 1, select: { url: true } },
        _count: { select: { offers: { where: { active: true, stock: { gt: 0 } } } } },
      },
    }),
    ratings ? Promise.resolve(ratings) : ratingMap(ids),
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ordered.flatMap((o) => {
    const v = byId.get(o.id);
    if (!v) return [];
    return [{
      id: v.id, name: v.name, type: v.type, lat: v.lat, lng: v.lng, city: v.city, cuisine: v.cuisine, priceLevel: v.priceLevel,
      openingHours: v.openingHours, image: v.coverImage ?? v.photos[0]?.url ?? null, offers: v._count.offers,
      rating: rmap.get(v.id)?.avg ?? null, reviews: rmap.get(v.id)?.count ?? 0, distanceKm: o.d,
    }];
  });
}

export type NearbyVenue = Awaited<ReturnType<typeof nearbyVenues>>[number];
