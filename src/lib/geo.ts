/** Distance en kilomètres entre deux points (formule de Haversine). */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(km < 10 ? 1 : 0)} km`;
}

/** Gouvernorat le plus proche d'un point (approximation par centroïde). */
export function nearestBy<T extends { lat: number; lng: number }>(items: T[], lat: number, lng: number): T {
  let best = items[0];
  let bestD = Infinity;
  for (const it of items) {
    const d = distanceKm(lat, lng, it.lat, it.lng);
    if (d < bestD) { bestD = d; best = it; }
  }
  return best;
}

/** Boîte englobante approximative de la Tunisie. */
export function isInTunisia(lat: number, lng: number): boolean {
  return lat >= 30.2 && lat <= 37.6 && lng >= 7.5 && lng <= 11.7;
}
