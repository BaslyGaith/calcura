"use client";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export type MapPoint = { id: string; name: string; type: string; lat: number; lng: number; city?: string | null };

const icon = (type: string) =>
  L.divIcon({
    className: "",
    html: `<div style="background:${type === "CAFE" ? "#78350f" : "#e8501f"};color:#fff;border:2px solid #fff;border-radius:9999px;width:30px;height:30px;display:grid;place-items:center;box-shadow:0 1px 4px rgba(0,0,0,.35);font-size:15px">${type === "CAFE" ? "☕" : "🍽"}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

function ClickPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function VenueMap({
  points,
  center,
  zoom = 7,
  height = "28rem",
  user,
  picker,
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  user?: [number, number] | null;
  picker?: { name: string; initial?: [number, number] | null };
}) {
  const [picked, setPicked] = useState<[number, number] | null>(picker?.initial ?? null);
  const c = useMemo<[number, number]>(() => center ?? user ?? [34.3, 9.6], [center, user]);
  const icons = useMemo(() => ({ CAFE: icon("CAFE"), RESTAURANT: icon("RESTAURANT") }), []);
  useEffect(() => setPicked(picker?.initial ?? null), [picker?.initial]);

  return (
    <div style={{ height }} className="overflow-hidden rounded-2xl border border-stone-200">
      <MapContainer center={c} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={p.type === "CAFE" ? icons.CAFE : icons.RESTAURANT}>
            <Popup>
              <Link href={`/venues/${p.id}`} className="font-semibold">{p.name}</Link>
              {p.city && <div className="text-xs text-stone-500">{p.city}</div>}
            </Popup>
          </Marker>
        ))}
        {user && <CircleMarker center={user} radius={9} pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.8 }} />}
        {picker && (
          <>
            <ClickPicker onPick={(lat, lng) => setPicked([lat, lng])} />
            {picked && <Marker position={picked} icon={icons.RESTAURANT} />}
          </>
        )}
      </MapContainer>
      {picker && (
        <>
          <input type="hidden" name={`${picker.name}Lat`} value={picked ? picked[0].toFixed(6) : ""} />
          <input type="hidden" name={`${picker.name}Lng`} value={picked ? picked[1].toFixed(6) : ""} />
        </>
      )}
    </div>
  );
}
