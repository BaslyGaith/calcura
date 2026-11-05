"use client";
import dynamic from "next/dynamic";

// Leaflet a besoin de `window` : chargement uniquement côté client.
export const VenueMapLazy = dynamic(() => import("./VenueMap"), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-stone-100" />,
});
