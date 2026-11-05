// Outils communs aux cartes (MapLibre GL, tuiles vectorielles).
import type { Map as MlMap, StyleSpecification } from "maplibre-gl";

/**
 * Style de carte : OpenFreeMap « liberty » par défaut (gratuit, sans clé, usage commercial
 * autorisé, données © OpenStreetMap). Personnalisable avec NEXT_PUBLIC_MAP_STYLE_URL
 * (ex. un style MapTiler, Stadia ou CARTO avec votre clé).
 */
export const MAP_STYLE_URL = process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";
const GLYPHS = "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";
export const LABEL_FONT = ["Noto Sans Bold"];

/** Style de secours si le style principal ne se charge pas : tuiles raster OpenStreetMap. */
export const FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  glyphs: GLYPHS,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>",
      maxzoom: 19,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#f2efe9" } },
    { id: "osm", type: "raster", source: "osm" },
  ],
};

export const TUNISIA_CENTER: [number, number] = [9.6, 34.3]; // [lng, lat]
export const TUNIS: [number, number] = [10.1815, 36.8065];

export const PIN_COLORS = { CAFE: "#a1561c", RESTAURANT: "#ef5a24" } as const;
const PIN_EMOJI = { CAFE: "☕", RESTAURANT: "🍽️" } as const;

/** Dessine une épingle façon « bulle » (couleur vive, bord blanc, ombre, émoji). */
function drawPin(type: "CAFE" | "RESTAURANT", offer: boolean) {
  const r = 2; // densité
  const w = 52 * r, h = 64 * r;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  const cx = w / 2, cy = 24 * r, rad = 19 * r;
  ctx.shadowColor = "rgba(0,0,0,.35)";
  ctx.shadowBlur = 6 * r;
  ctx.shadowOffsetY = 2 * r;
  // queue
  ctx.beginPath();
  ctx.moveTo(cx - 9 * r, cy + 14 * r);
  ctx.lineTo(cx, h - 6 * r);
  ctx.lineTo(cx + 9 * r, cy + 14 * r);
  ctx.closePath();
  ctx.fillStyle = "#fff";
  ctx.fill();
  // disque blanc puis couleur
  ctx.beginPath(); ctx.arc(cx, cy, rad + 3.5 * r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  const grad = ctx.createLinearGradient(cx, cy - rad, cx, cy + rad);
  grad.addColorStop(0, PIN_COLORS[type]);
  grad.addColorStop(1, type === "CAFE" ? "#7a3d0f" : "#c2410c");
  ctx.fillStyle = grad; ctx.fill();
  ctx.font = `${19 * r}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(PIN_EMOJI[type], cx, cy + 1 * r);
  if (offer) {
    ctx.beginPath(); ctx.arc(cx + 17 * r, cy - 15 * r, 9 * r, 0, Math.PI * 2);
    ctx.fillStyle = "#16a34a"; ctx.fill();
    ctx.lineWidth = 2.5 * r; ctx.strokeStyle = "#fff"; ctx.stroke();
    ctx.font = `${10 * r}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.fillText("🎁", cx + 17 * r, cy - 14.5 * r);
  }
  return { width: w, height: h, data: new Uint8Array(ctx.getImageData(0, 0, w, h).data.buffer) };
}

export function pinImageName(type: string, offer: boolean) {
  return `pin-${type === "CAFE" ? "CAFE" : "RESTAURANT"}${offer ? "-offer" : ""}`;
}

/** Ajoute les images d'épingles au style courant (à rappeler après chaque changement de style). */
export function addPinImages(map: MlMap) {
  for (const type of ["CAFE", "RESTAURANT"] as const) {
    for (const offer of [false, true]) {
      const name = pinImageName(type, offer);
      if (!map.hasImage(name)) map.addImage(name, drawPin(type, offer), { pixelRatio: 2 });
    }
  }
}

/**
 * Charge le style principal ; s'il échoue (réseau, quota), bascule sur le style de secours.
 * `onStyle` est appelé à chaque style prêt pour (re)créer sources, couches et images.
 */
export function withStyleFallback(map: MlMap, onStyle: () => void) {
  let loaded = false;
  let fellBack = false;
  const fallback = () => {
    if (loaded || fellBack) return;
    fellBack = true;
    map.setStyle(FALLBACK_STYLE);
  };
  map.on("style.load", () => {
    loaded = true;
    onStyle();
  });
  map.on("error", (e) => {
    // Erreur de chargement du style principal (avant le premier « style.load »).
    if (!loaded && !fellBack) fallback();
    else if (process.env.NODE_ENV !== "production") console.debug("map:", e.error?.message);
  });
  const timer = setTimeout(fallback, 8000);
  map.once("style.load", () => clearTimeout(timer));
}

/** Point bleu « vous êtes ici », avec halo animé. */
export function createUserDot() {
  const el = document.createElement("div");
  el.className = "bp-user-dot";
  el.innerHTML = "<span></span>";
  el.setAttribute("aria-label", "Ma position");
  return el;
}
