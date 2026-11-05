import { test } from "node:test";
import assert from "node:assert/strict";
import { en, fr, translate } from "../src/lib/i18n/dictionaries";

test("le français et l'anglais ont exactement les mêmes clés", () => {
  assert.deepEqual(Object.keys(en).sort(), Object.keys(fr).sort());
});

test("interpolation des variables", () => {
  assert.equal(translate(fr, "games.won", { n: 25 }), "Bravo ! Vous gagnez 25 points.");
  assert.equal(translate(en, "games.won", { n: 25 }), "Well done! You earn 25 points.");
});
