import { prisma } from "@/lib/db";
import { NearbyExplorerLazy } from "@/components/map/NearbyExplorerLazy";

export const dynamic = "force-dynamic";

/**
 * Accueil = carte plein écran centrée sur la position de l'utilisateur.
 * Paramètres facultatifs : ?type=CAFE|RESTAURANT, ?q=…, ?gov=<slug> (centre sur un gouvernorat).
 */
export default async function HomeMap({ searchParams }: { searchParams: { type?: string; q?: string; gov?: string } }) {
  const gov = searchParams.gov ? await prisma.governorate.findUnique({ where: { slug: searchParams.gov } }) : null;
  return (
    <NearbyExplorerLazy
      initial={{
        type: searchParams.type,
        q: searchParams.q,
        center: gov ? [gov.lng, gov.lat] : undefined,
        zoom: gov ? 12 : undefined,
      }}
    />
  );
}
