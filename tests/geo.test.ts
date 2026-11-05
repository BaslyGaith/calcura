import { test } from "node:test";
import assert from "node:assert/strict";
import { distanceKm, isInTunisia, nearestBy } from "../src/lib/geo";
import { GOVERNORATES } from "../src/lib/governorates";

test("24 gouvernorats avec des codes et slugs uniques", () => {
  assert.equal(GOVERNORATES.length, 24);
  assert.equal(new Set(GOVERNORATES.map((g) => g.code)).size, 24);
  assert.equal(new Set(GOVERNORATES.map((g) => g.slug)).size, 24);
  for (const g of GOVERNORATES) assert.ok(isInTunisia(g.lat, g.lng), g.slug);
});

test("distance Tunis – Sfax ≈ 230 km", () => {
  const d = distanceKm(36.8065, 10.1815, 34.7406, 10.7603);
  assert.ok(d > 220 && d < 245, String(d));
});

test("le gouvernorat le plus proche de Hammamet est Nabeul", () => {
  assert.equal(nearestBy(GOVERNORATES, 36.4, 10.6).slug, "nabeul");
});
