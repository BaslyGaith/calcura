"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { GeoJSONSource, Map as MlMap, Marker } from "maplibre-gl";
import { useT } from "@/lib/i18n/client";
import { formatDistance } from "@/lib/geo";
import type { NearbyVenue } from "@/lib/venues";
import { addPinImages, createUserDot, LABEL_FONT, MAP_STYLE_URL, pinImageName, TUNIS, withStyleFallback } from "./mapCore";

type Filters = { type: "" | "CAFE" | "RESTAURANT"; offers: boolean; top: boolean; q: string };
type Geo = "idle" | "locating" | "ok" | "denied";

const LAST_POS_KEY = "bp_last_pos";

function readLastPos(): [number, number] | null {
  try {
    const v = JSON.parse(localStorage.getItem(LAST_POS_KEY) ?? "null");
    return Array.isArray(v) && v.length === 2 && v.every(Number.isFinite) ? [v[0], v[1]] : null;
  } catch { return null; }
}
function saveLastPos(p: [number, number]) {
  try { localStorage.setItem(LAST_POS_KEY, JSON.stringify(p)); } catch { /* stockage indisponible */ }
}

export const wazeUrl = (lat: number, lng: number) => `https://waze.com/ul?ll=${lat}%2C${lng}&navigate=yes`;

/**
 * Carte d'accueil : démarre sur la position de l'utilisateur, affiche les cafés et
 * restaurants alentour (épingles colorées, regroupées quand on dézoome) et une liste
 * des lieux les plus proches, synchronisée avec la carte.
 */
export default function NearbyExplorer({ initial }: { initial: { type?: string; q?: string; center?: [number, number]; zoom?: number } }) {
  const { t } = useT();
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const userMarker = useRef<Marker | null>(null);
  const userPos = useRef<[number, number] | null>(null); // [lng, lat]
  const watchId = useRef<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geojson = useRef<GeoJSON.FeatureCollection>({ type: "FeatureCollection", features: [] });
  const cardRefs = useRef(new Map<string, HTMLElement>());
  // Zoom intelligent : après la localisation, on dézoome tant qu'il y a trop peu de lieux autour.
  const autoExpand = useRef(false);

  const [filters, setFilters] = useState<Filters>({
    type: initial.type === "CAFE" || initial.type === "RESTAURANT" ? initial.type : "",
    offers: false, top: false, q: initial.q ?? "",
  });
  const filtersRef = useRef(filters);
  const [qInput, setQInput] = useState(initial.q ?? "");
  const [venues, setVenues] = useState<NearbyVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [geo, setGeo] = useState<Geo>("idle");
  const [sheetOpen, setSheetOpen] = useState(true);

  const fetchVenues = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    const f = filtersRef.current;
    const p = new URLSearchParams({ n: String(b.getNorth()), s: String(b.getSouth()), e: String(b.getEast()), w: String(b.getWest()) });
    if (userPos.current) { p.set("lng", String(userPos.current[0])); p.set("lat", String(userPos.current[1])); }
    if (f.type) p.set("type", f.type);
    if (f.offers) p.set("offers", "1");
    if (f.top) p.set("top", "1");
    if (f.q) p.set("q", f.q);
    abort.current?.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/venues/nearby?${p}`, { signal: ctrl.signal });
      const { items } = (await res.json()) as { items: NearbyVenue[] };
      setVenues(items);
      geojson.current = {
        type: "FeatureCollection",
        features: items.map((v) => ({
          type: "Feature",
          properties: { id: v.id, name: v.name, icon: pinImageName(v.type, v.offers > 0) },
          geometry: { type: "Point", coordinates: [v.lng, v.lat] },
        })),
      };
      (map.getSource("venues") as GeoJSONSource | undefined)?.setData(geojson.current);
      setLoading(false);
      if (autoExpand.current && items.length < 6 && map.getZoom() > 11.5) {
        map.easeTo({ zoom: map.getZoom() - 1, duration: 500 });
      } else {
        autoExpand.current = false;
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) setLoading(false);
    }
  }, []);

  const scheduleFetch = useCallback(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(fetchVenues, 300);
  }, [fetchVenues]);

  const showUser = useCallback(async (lngLat: [number, number]) => {
    const map = mapRef.current;
    if (!map) return;
    const ml = (await import("maplibre-gl")).default;
    if (!userMarker.current) userMarker.current = new ml.Marker({ element: createUserDot() }).setLngLat(lngLat).addTo(map);
    else userMarker.current.setLngLat(lngLat);
  }, []);

  /** Demande la position, centre la carte dessus puis suit les déplacements. */
  const locate = useCallback(() => {
    if (!navigator.geolocation) return setGeo("denied");
    setGeo("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.longitude, pos.coords.latitude];
        userPos.current = p;
        saveLastPos(p);
        setGeo("ok");
        showUser(p);
        autoExpand.current = true;
        mapRef.current?.flyTo({ center: p, zoom: 15, speed: 1.6 });
        if (watchId.current === null) {
          watchId.current = navigator.geolocation.watchPosition((w) => {
            const np: [number, number] = [w.coords.longitude, w.coords.latitude];
            userPos.current = np;
            showUser(np);
          }, () => {}, { enableHighAccuracy: true, maximumAge: 15000 });
        }
      },
      () => setGeo("denied"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [showUser]);

  // Initialisation de la carte
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ml = (await import("maplibre-gl")).default;
      if (cancelled || !mapDiv.current) return;
      const last = initial.center ? null : readLastPos();
      const map = new ml.Map({
        container: mapDiv.current,
        style: MAP_STYLE_URL,
        center: initial.center ?? last ?? TUNIS,
        zoom: initial.zoom ?? (last ? 14 : 12),
        attributionControl: { compact: true },
        dragRotate: false,
      });
      mapRef.current = map;
      map.touchZoomRotate.disableRotation();

      withStyleFallback(map, () => {
        addPinImages(map);
        if (map.getSource("venues")) return;
        map.addSource("venues", { type: "geojson", data: geojson.current, cluster: true, clusterRadius: 48, clusterMaxZoom: 14 });
        map.addLayer({
          id: "clusters", type: "circle", source: "venues", filter: ["has", "point_count"],
          paint: {
            "circle-color": ["step", ["get", "point_count"], "#fb923c", 10, "#f97316", 50, "#ea580c"],
            "circle-radius": ["step", ["get", "point_count"], 20, 10, 25, 50, 31],
            "circle-stroke-width": 4, "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer({
          id: "cluster-count", type: "symbol", source: "venues", filter: ["has", "point_count"],
          layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": LABEL_FONT, "text-size": 14 },
          paint: { "text-color": "#ffffff" },
        });
        map.addLayer({
          id: "venue-pins", type: "symbol", source: "venues", filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": ["get", "icon"], "icon-anchor": "bottom", "icon-allow-overlap": true,
            "icon-size": ["case", ["==", ["get", "id"], selectedRef.current ?? ""], 1.35, 1],
            "symbol-z-order": "source",
          },
        });
        map.addLayer({
          id: "venue-labels", type: "symbol", source: "venues", filter: ["!", ["has", "point_count"]], minzoom: 15,
          layout: { "text-field": ["get", "name"], "text-font": LABEL_FONT, "text-size": 12, "text-anchor": "top", "text-offset": [0, 0.3], "text-max-width": 9, "text-optional": true },
          paint: { "text-color": "#292524", "text-halo-color": "#ffffff", "text-halo-width": 2 },
        });
      });

      map.on("click", "venue-pins", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) { setSelected(id); setSheetOpen(true); }
      });
      map.on("click", "clusters", async (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const src = map.getSource("venues") as GeoJSONSource;
        const zoom = await src.getClusterExpansionZoom(f.properties?.cluster_id);
        map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });
      for (const layer of ["venue-pins", "clusters"]) {
        map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
      }
      map.on("moveend", scheduleFetch);
      map.on("dragstart", () => { autoExpand.current = false; });
      map.once("style.load", () => scheduleFetch());
      if (!initial.center) locate();
    })();
    return () => {
      cancelled = true;
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      abort.current?.abort();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtres → nouvelle recherche
  useEffect(() => {
    const changed = filtersRef.current !== filters;
    filtersRef.current = filters;
    if (mapRef.current) {
      // Nouvelle recherche : on élargit la zone si elle contient trop peu de résultats.
      if (changed) autoExpand.current = true;
      scheduleFetch();
    }
  }, [filters, scheduleFetch]);

  // Recherche texte avec un léger délai
  useEffect(() => {
    const h = setTimeout(() => setFilters((f) => (f.q === qInput.trim() ? f : { ...f, q: qInput.trim() })), 350);
    return () => clearTimeout(h);
  }, [qInput]);

  // Sélection : épingle agrandie + carte de la liste visible
  useEffect(() => {
    selectedRef.current = selected;
    const map = mapRef.current;
    if (map?.getLayer("venue-pins")) map.setLayoutProperty("venue-pins", "icon-size", ["case", ["==", ["get", "id"], selected ?? ""], 1.35, 1]);
    if (selected) cardRefs.current.get(selected)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selected]);

  const focus = (v: NearbyVenue) => {
    setSelected(v.id);
    mapRef.current?.easeTo({ center: [v.lng, v.lat], zoom: Math.max(mapRef.current.getZoom(), 15.5), duration: 700 });
  };

  const chip = (active: boolean) =>
    `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-md transition ${active ? "bg-stone-900 text-white" : "bg-white text-stone-700 hover:bg-orange-50"}`;
  const countLabel = geo === "ok" ? t("map.nearby", { n: venues.length }) : t("map.inArea", { n: venues.length });

  const renderCard = (v: NearbyVenue, compact?: boolean) => (
    <article
      key={v.id}
      ref={(el) => { if (el) cardRefs.current.set(v.id, el); else cardRefs.current.delete(v.id); }}
      onClick={() => focus(v)}
      className={`cursor-pointer overflow-hidden rounded-2xl border bg-white transition ${selected === v.id ? "border-brand-500 ring-2 ring-brand-200" : "border-stone-200 hover:border-brand-300"} ${compact ? "w-[17.5rem] shrink-0 snap-center" : "shrink-0"}`}
    >
      <div className="flex gap-3 p-2.5">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-amber-50">
          {v.image
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={v.image} alt="" loading="lazy" className="h-full w-full object-cover" />
            : <span className="grid h-full place-items-center text-3xl">{v.type === "CAFE" ? "☕" : "🍽️"}</span>}
          {v.offers > 0 && <span className="absolute left-1 top-1 rounded-full bg-olive-500 px-1.5 text-[10px] font-bold text-white">🎁 {v.offers}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-1 font-bold">{v.name}</h3>
          <p className="line-clamp-1 text-xs text-stone-500">{v.type === "CAFE" ? t("common.cafe") : t("common.restaurant")}{v.city ? ` · ${v.city}` : ""}{v.cuisine ? ` · ${v.cuisine}` : ""}</p>
          <p className="mt-1 flex items-center gap-2 text-xs">
            {v.rating !== null && <span className="font-semibold text-amber-600">★ {v.rating.toFixed(1)}</span>}
            <span className="text-stone-500">{"DT".repeat(v.priceLevel)}</span>
            <span className="font-bold text-brand-600">{formatDistance(v.distanceKm)}</span>
          </p>
          <div className="mt-1.5 flex gap-1.5">
            <a href={wazeUrl(v.lat, v.lng)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="whitespace-nowrap rounded-full bg-sky-500 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-600">🚗 {t("map.go")}</a>
            <Link href={`/venues/${v.id}`} onClick={(e) => e.stopPropagation()} className="whitespace-nowrap rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-200">{t("map.see")}</Link>
          </div>
        </div>
      </div>
    </article>
  );

  const renderList = (compact?: boolean) =>
    venues.length === 0 && !loading ? (
      <p className="p-4 text-center text-sm text-stone-500">{t("map.empty")}</p>
    ) : (
      <div className={compact ? "no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3" : "flex flex-col gap-2 overflow-y-auto p-3"}>
        {venues.slice(0, 60).map((v) => renderCard(v, compact))}
      </div>
    );

  return (
    <div className="relative h-[calc(100dvh-3.5rem-4rem)] overflow-hidden lg:h-[calc(100dvh-3.5rem)]">
      {/* Le CSS de MapLibre impose position:relative au conteneur : on l'enveloppe. */}
      <div className="absolute inset-0">
        <div ref={mapDiv} className="h-full w-full bg-[#f2efe9]" aria-label={t("nav.map")} />
      </div>

      {/* Recherche + filtres */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 lg:left-[25rem]">
        <div className="pointer-events-auto mx-auto flex max-w-xl items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-lg ring-1 ring-black/5">
          <span aria-hidden>🔍</span>
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder={t("map.searchPlaceholder")}
            aria-label={t("common.search")}
            className="w-full bg-transparent text-sm outline-none"
          />
          {qInput && <button type="button" onClick={() => setQInput("")} aria-label="×" className="text-stone-400">✕</button>}
          {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" aria-hidden />}
        </div>
        <div className="no-scrollbar pointer-events-auto mx-auto mt-2 flex max-w-xl gap-2 overflow-x-auto pb-1">
          <button className={chip(!filters.type)} onClick={() => setFilters((f) => ({ ...f, type: "" }))}>{t("common.all")}</button>
          <button className={chip(filters.type === "CAFE")} onClick={() => setFilters((f) => ({ ...f, type: f.type === "CAFE" ? "" : "CAFE" }))}>☕ {t("common.cafes")}</button>
          <button className={chip(filters.type === "RESTAURANT")} onClick={() => setFilters((f) => ({ ...f, type: f.type === "RESTAURANT" ? "" : "RESTAURANT" }))}>🍽️ {t("common.restaurants")}</button>
          <button className={chip(filters.offers)} onClick={() => setFilters((f) => ({ ...f, offers: !f.offers }))}>🎁 {t("map.offers")}</button>
          <button className={chip(filters.top)} onClick={() => setFilters((f) => ({ ...f, top: !f.top }))}>⭐ 4+</button>
        </div>
        {geo === "denied" && (
          <div className="pointer-events-auto mx-auto mt-2 flex max-w-xl items-center justify-between gap-2 rounded-2xl bg-sky-50 px-4 py-2 text-sm text-sky-900 shadow-md ring-1 ring-sky-200">
            <span>📍 {t("map.locationOff")}</span>
            <button className="font-bold underline" onClick={locate}>{t("map.retry")}</button>
          </div>
        )}
      </div>

      {/* Bouton « ma position » */}
      <button
        type="button"
        onClick={locate}
        aria-label={t("map.locate")}
        title={t("map.locate")}
        className={`absolute right-3 z-10 grid h-12 w-12 place-items-center rounded-full bg-white text-xl shadow-lg ring-1 ring-black/5 transition hover:scale-105 lg:bottom-8 ${sheetOpen ? "bottom-[13.5rem]" : "bottom-20"} ${geo === "ok" ? "text-sky-600" : ""}`}
      >
        {geo === "locating" ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" /> : "🎯"}
      </button>

      {/* Liste — ordinateur */}
      <aside className="absolute bottom-3 left-3 top-3 z-10 hidden w-96 flex-col overflow-hidden rounded-3xl bg-white/95 shadow-xl ring-1 ring-black/5 backdrop-blur lg:flex">
        <div className="border-b border-stone-100 px-4 py-3">
          <h2 className="font-extrabold">{countLabel}</h2>
          <p className="text-xs text-stone-500">{t("map.hint")}</p>
        </div>
        {renderList()}
      </aside>

      {/* Liste — mobile (panneau du bas) */}
      <section className="absolute inset-x-0 bottom-0 z-10 rounded-t-3xl bg-white shadow-[0_-8px_24px_rgba(0,0,0,.12)] lg:hidden">
        <button type="button" onClick={() => setSheetOpen((o) => !o)} className="flex w-full flex-col items-center px-4 pb-2 pt-2" aria-expanded={sheetOpen}>
          <span className="h-1.5 w-10 rounded-full bg-stone-300" />
          <span className="mt-2 flex w-full items-center justify-between text-sm">
            <span className="font-extrabold">{countLabel}</span>
            <span className="text-xs font-semibold text-brand-600">{sheetOpen ? t("map.hideList") : t("map.showList")}</span>
          </span>
        </button>
        {sheetOpen && renderList(true)}
      </section>
    </div>
  );
}
