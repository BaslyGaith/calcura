import { test } from "node:test";
import assert from "node:assert/strict";
import { pickVenues, priceDistractors, questionFor, type MenuQuizVenue } from "../src/lib/menu-quiz";
import { GOVERNORATES } from "../src/lib/governorates";

const govs = GOVERNORATES.map((g) => ({ fr: g.nameFr, en: g.nameEn }));
const venue: MenuQuizVenue = {
  id: "v1", name: "Café Test", city: "Sousse", image: null, sponsored: true,
  governorate: { fr: "Sousse", en: "Sousse" },
  items: [
    { name: "Express", price: 1.8, category: "Boissons chaudes" },
    { name: "Capucin", price: 2.2, category: "Boissons chaudes" },
    { name: "Café crème", price: 2.5, category: "Boissons chaudes" },
    { name: "Thé aux pignons", price: 3.5, category: "Boissons chaudes" },
  ],
};

test("chaque question de menu a 4 options distinctes et une seule bonne réponse cohérente", () => {
  for (let i = 0; i < 300; i++) {
    const q = questionFor(venue, 1000, i % 2 ? "fr" : "en", ["Pizza", "Couscous", "Ojja", "Express"], govs);
    assert.ok(q);
    assert.equal(q.options.length, 4);
    assert.equal(new Set(q.options).size, 4, q.q);
    assert.ok(q.answer >= 0 && q.answer < 4);
    assert.equal(q.venue.id, "v1");
    const correct = q.options[q.answer];
    if (q.q.includes("menu")) {
      assert.ok(venue.items.some((it) => it.name === correct));
      // aucune mauvaise réponse ne doit être au menu
      for (const o of q.options) if (o !== correct) assert.ok(!venue.items.some((it) => it.name === o), o);
    }
    if (/moins cher|cheapest/.test(q.q)) assert.equal(correct, "Express");
    // la ville « Sousse » révèle le gouvernorat : pas de question de lieu
    assert.ok(!/gouvernorat|governorate/.test(q.q), q.q);
    if (/Combien|How much/.test(q.q)) assert.ok(/^\d+\.\d{3} (DT|TND)$/.test(correct));
  }
});

test("les prix proposés sont différents du vrai prix", () => {
  for (const p of [0.5, 1.2, 1.8, 18, 25]) {
    const d = priceDistractors(p);
    assert.equal(d.length, 3);
    assert.equal(new Set([p, ...d]).size, 4);
    for (const x of d) assert.ok(x > 0);
  }
});

test("les commerçants abonnés sont plus souvent choisis", () => {
  const pool = Array.from({ length: 10 }, (_, i) => ({ id: String(i), sponsored: i === 0 }));
  let hits = 0;
  for (let k = 0; k < 2000; k++) if (pickVenues(pool, 1, 5)[0].id === "0") hits++;
  // poids 5 sur un total de 14 ≈ 36 %, contre 10 % sans priorité
  assert.ok(hits > 500 && hits < 950, String(hits));
  const picked = pickVenues(pool, 3, 5);
  assert.equal(new Set(picked.map((p) => p.id)).size, 3);
});

test("question de gouvernorat quand ni le nom ni la ville ne le révèlent", () => {
  const v = { ...venue, name: "Chez Hamadi", city: "Hammamet", governorate: { fr: "Nabeul", en: "Nabeul" }, items: [] };
  const q = questionFor(v, 1000, "fr", [], govs);
  assert.ok(q && /gouvernorat/.test(q.q));
  assert.equal(q.options[q.answer], "Nabeul");
});
