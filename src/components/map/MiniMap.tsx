"use client";
import { useEffect, useRef, useState } from "react";
import type { Map as MlMap, Marker } from "maplibre-gl";
import { addPinImages, MAP_STYLE_URL, pinImageName, TUNIS, withStyleFallback } from "./mapCore";

type Point = { id: string; name: string; type: string; lat: number; lng: number };

/**
 * Petite carte : affiche un ou plusieurs établissements, ou sert de sélecteur de position
 * (picker) avec une épingle déplaçable. Les champs cachés `${name}Lat` / `${name}Lng`
 * sont envoyés avec le formulaire.
 */
export default function MiniMap({
  points = [],
  center,
  zoom = 15,
  height = "16rem",
  picker,
}: {
  points?: Point[];
  center?: [number, number]; // [lat, lng]
  zoom?: number;
  height?: string;
  picker?: { name: string; initial?: [number, number] | null };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const [picked, setPicked] = useState<[number, number] | null>(picker?.initial ?? null);

  useEffect(() => {
    let cancelled = false;
    let marker: Marker | null = null;
    (async () => {
      const ml = (await import("maplibre-gl")).default;
      if (cancelled || !ref.current) return;
      const c = center ?? (points[0] ? [points[0].lat, points[0].lng] : [TUNIS[1], TUNIS[0]]);
      const map = new ml.Map({ container: ref.current, style: MAP_STYLE_URL, center: [c[1], c[0]], zoom, attributionControl: { compact: true } });
      mapRef.current = map;
      map.addControl(new ml.NavigationControl({ showCompass: false }), "top-right");
      withStyleFallback(map, () => {
        addPinImages(map);
        if (map.getSource("pts")) return;
        map.addSource("pts", {
          type: "geojson",
          data: { type: "FeatureCollection", features: points.map((p) => ({ type: "Feature", properties: { icon: pinImageName(p.type, false) }, geometry: { type: "Point", coordinates: [p.lng, p.lat] } })) },
        });
        map.addLayer({ id: "pts", type: "symbol", source: "pts", layout: { "icon-image": ["get", "icon"], "icon-anchor": "bottom", "icon-allow-overlap": true } });
      });
      if (picker) {
        const place = (lngLat: [number, number]) => {
          if (!marker) {
            marker = new ml.Marker({ color: "#ef5a24", draggable: true }).setLngLat(lngLat).addTo(map);
            marker.on("dragend", () => { const p = marker!.getLngLat(); setPicked([p.lat, p.lng]); });
          } else marker.setLngLat(lngLat);
          setPicked([lngLat[1], lngLat[0]]);
        };
        if (picker.initial) place([picker.initial[1], picker.initial[0]]);
        map.on("click", (e) => place([e.lngLat.lng, e.lngLat.lat]));
      }
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={ref} style={{ height }} className="overflow-hidden rounded-2xl border border-stone-200 bg-[#f2efe9]" />
      {picker && (
        <>
          <input type="hidden" name={`${picker.name}Lat`} value={picked ? picked[0].toFixed(6) : ""} />
          <input type="hidden" name={`${picker.name}Lng`} value={picked ? picked[1].toFixed(6) : ""} />
        </>
      )}
    </div>
  );
}
