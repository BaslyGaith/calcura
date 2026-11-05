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

import { parseBounds } from "../src/lib/geo";

test("parseBounds normalise et rejette les zones invalides", () => {
  assert.deepEqual(parseBounds({ n: "36.9", s: "36.7", e: "10.3", w: "10.1" }), { n: 36.9, s: 36.7, e: 10.3, w: 10.1 });
  assert.deepEqual(parseBounds({ n: 36.7, s: 36.9, e: 10.1, w: 10.3 }), { n: 36.9, s: 36.7, e: 10.3, w: 10.1 });
  assert.equal(parseBounds({ n: "x", s: 1, e: 2, w: 1 }), null);
  assert.equal(parseBounds({ n: 1, s: 1, e: 2, w: 1 }), null);
  assert.equal(parseBounds({}), null);
});
