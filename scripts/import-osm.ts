/**
 * Extraction des cafés et restaurants de Tunisie depuis OpenStreetMap (API Overpass).
 *
 * Usage :
 *   npm run import:osm                      # les 24 gouvernorats
 *   npm run import:osm -- --gov=tunis,sfax  # certains gouvernorats (slugs)
 *   npm run import:osm -- --dry-run         # affiche les comptes sans écrire
 *   OVERPASS_URL=https://overpass.kumi.systems/api/interpreter npm run import:osm
 *
 * Les données OSM sont sous licence ODbL : l'attribution « © contributeurs OpenStreetMap »
 * est affichée dans l'application. Les établissements rattachés à un commerçant ne sont
 * jamais écrasés par un nouvel import.
 */
import { prisma } from "../src/lib/db";
import { GOVERNORATES } from "../src/lib/governorates";

const ENDPOINT = process.env.OVERPASS_URL ?? "https://overpass-api.de/api/interpreter";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const govArg = args.find((a) => a.startsWith("--gov="))?.slice(6);
const targets = govArg ? GOVERNORATES.filter((g) => govArg.split(",").includes(g.slug)) : GOVERNORATES;

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export function buildQuery(isoCode: string) {
  return `[out:json][timeout:300];
area["ISO3166-2"="${isoCode}"]->.a;
(
  nwr["amenity"~"^(cafe|restaurant|fast_food)$"](area.a);
);
out center tags;`;
}

export function mapElement(el: OsmElement) {
  const tags = el.tags ?? {};
  const name = tags.name ?? tags["name:fr"] ?? tags["name:en"] ?? tags["name:ar"];
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!name || lat === undefined || lng === undefined) return null;
  const features: string[] = [];
  if (["wlan", "yes", "wifi"].includes(tags.internet_access ?? "")) features.push("wifi");
  if (tags.outdoor_seating === "yes") features.push("terrasse");
  if (tags.air_conditioning === "yes") features.push("climatisation");
  if (tags.delivery === "yes") features.push("livraison");
  if (tags.smoking === "no") features.push("non_fumeur");
  if (tags["parking"] || tags["amenity:parking"]) features.push("parking");
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  return {
    osmId: `${el.type}/${el.id}`,
    name: name.slice(0, 120),
    type: tags.amenity === "cafe" ? "CAFE" : "RESTAURANT",
    cuisine: tags.cuisine?.replace(/;/g, ", ").replace(/_/g, " ") ?? (tags.amenity === "fast_food" ? "fast food" : null),
    address: street || null,
    city: tags["addr:city"] ?? tags["addr:place"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    website: tags.website ?? tags["contact:website"] ?? null,
    openingHours: tags.opening_hours ?? null,
    features: features.join(",") || null,
    lat,
    lng,
  };
}

async function fetchOverpass(query: string, attempt = 1): Promise<OsmElement[]> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "BonPlan-importer/1.0" },
    body: new URLSearchParams({ data: query }),
  });
  if (res.status === 429 || res.status === 504) {
    if (attempt > 4) throw new Error(`Overpass indisponible (${res.status})`);
    const wait = 15000 * attempt;
    console.warn(`  Overpass ${res.status}, nouvel essai dans ${wait / 1000}s…`);
    await new Promise((r) => setTimeout(r, wait));
    return fetchOverpass(query, attempt + 1);
  }
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { elements: OsmElement[] };
  return json.elements;
}

async function main() {
  console.log(`Import OSM depuis ${ENDPOINT} — ${targets.length} gouvernorat(s)${dryRun ? " (dry-run)" : ""}`);
  let created = 0, updated = 0, skipped = 0;
  for (const g of targets) {
    const gov = await prisma.governorate.findUnique({ where: { code: g.code } });
    if (!gov) throw new Error(`Gouvernorat ${g.code} absent : lancez d'abord « npm run db:seed ».`);
    process.stdout.write(`• ${g.nameFr} (${g.code}) … `);
    const elements = await fetchOverpass(buildQuery(g.code));
    const venues = elements.map(mapElement).filter((v): v is NonNullable<ReturnType<typeof mapElement>> => v !== null);
    console.log(`${venues.length} lieux`);
    if (dryRun) continue;
    for (const v of venues) {
      const existing = await prisma.venue.findUnique({ where: { osmId: v.osmId } });
      if (existing?.ownerId) { skipped++; continue; } // géré par un commerçant
      if (existing) {
        await prisma.venue.update({ where: { id: existing.id }, data: { ...v, governorateId: gov.id } });
        updated++;
      } else {
        await prisma.venue.create({ data: { ...v, governorateId: gov.id, source: "OSM", status: "ACTIVE" } });
        created++;
      }
    }
    await new Promise((r) => setTimeout(r, 3000)); // politesse envers le serveur Overpass
  }
  console.log(`Terminé : ${created} créés, ${updated} mis à jour, ${skipped} ignorés (gérés par un commerçant).`);
}

if (require.main === module) {
  main()
    .catch((e) => { console.error(e); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
