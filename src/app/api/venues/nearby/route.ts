import { NextResponse } from "next/server";
import { parseBounds } from "@/lib/geo";
import { nearbyVenues } from "@/lib/venues";

// GET /api/venues/nearby?n=&s=&e=&w=&lat=&lng=&type=CAFE|RESTAURANT&offers=1&top=1&q=
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const bounds = parseBounds({ n: p.get("n"), s: p.get("s"), e: p.get("e"), w: p.get("w") });
  if (!bounds) return NextResponse.json({ error: "bounds" }, { status: 400 });
  const lat = Number(p.get("lat"));
  const lng = Number(p.get("lng"));
  const ref = Number.isFinite(lat) && Number.isFinite(lng) && p.get("lat") && p.get("lng")
    ? { lat, lng }
    : { lat: (bounds.n + bounds.s) / 2, lng: (bounds.e + bounds.w) / 2 };
  const items = await nearbyVenues({
    bounds, ref,
    type: p.get("type") ?? undefined,
    offers: p.get("offers") === "1",
    topRated: p.get("top") === "1",
    q: p.get("q")?.trim().slice(0, 80) || undefined,
    limit: 300,
  });
  return NextResponse.json({ items });
}
