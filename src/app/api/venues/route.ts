import { NextResponse } from "next/server";
import { searchVenues } from "@/lib/venues";

// API publique en lecture (utile pour une future application mobile).
// GET /api/venues?q=&type=CAFE|RESTAURANT&gov=tunis&lat=&lng=&sort=distance&page=1
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  const sort = p.get("sort");
  const res = await searchVenues({
    q: p.get("q") ?? undefined,
    type: p.get("type") ?? undefined,
    gov: p.get("gov") ?? undefined,
    lat: num("lat"),
    lng: num("lng"),
    page: num("page"),
    perPage: Math.min(50, num("perPage") ?? 24),
    sort: sort === "distance" || sort === "rating" || sort === "name" || sort === "recent" ? sort : undefined,
  });
  return NextResponse.json({
    total: res.total, page: res.page, pages: res.pages,
    items: res.items.map((v) => ({
      id: v.id, name: v.name, type: v.type, city: v.city, governorate: v.governorate.slug,
      lat: v.lat, lng: v.lng, rating: v.rating, reviewCount: v.reviewCount, distanceKm: v.distance, image: v.image, priceLevel: v.priceLevel,
    })),
  });
}
