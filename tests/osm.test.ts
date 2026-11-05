import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuery, mapElement } from "../scripts/import-osm";

test("la requête Overpass cible le bon gouvernorat", () => {
  const q = buildQuery("TN-51");
  assert.match(q, /ISO3166-2"="TN-51"/);
  assert.match(q, /cafe\|restaurant\|fast_food/);
});

test("mapElement convertit un nœud OSM", () => {
  const v = mapElement({ type: "node", id: 42, lat: 35.8, lon: 10.6, tags: { amenity: "cafe", name: "Café Test", outdoor_seating: "yes", internet_access: "wlan", "addr:city": "Sousse" } });
  assert.ok(v);
  assert.equal(v.osmId, "node/42");
  assert.equal(v.type, "CAFE");
  assert.equal(v.city, "Sousse");
  assert.equal(v.features, "wifi,terrasse");
});

test("mapElement utilise le centre des polygones et ignore les lieux sans nom", () => {
  assert.equal(mapElement({ type: "way", id: 1, center: { lat: 36, lon: 10 }, tags: { amenity: "restaurant" } }), null);
  const v = mapElement({ type: "way", id: 2, center: { lat: 36, lon: 10 }, tags: { amenity: "fast_food", "name:ar": "مطعم" } });
  assert.equal(v?.type, "RESTAURANT");
  assert.equal(v?.lat, 36);
});
