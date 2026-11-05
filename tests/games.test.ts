import { test } from "node:test";
import assert from "node:assert/strict";
import { QUIZ_BANK, pickQuiz, scoreQuiz, scoreMemory, spinWheel, wheelValues, WHEEL_SEGMENTS, MEMORY_PAIRS } from "../src/lib/games";

test("le quiz ne divulgue pas les réponses au client", () => {
  const { questions, key } = pickQuiz("fr");
  assert.equal(questions.length, 5);
  for (const q of questions) {
    assert.equal("answer" in q, false);
    const orig = QUIZ_BANK.find((b) => b.id === q.id)!;
    // la clé pointe vers la bonne réponse après mélange
    assert.equal(q.options[key[q.id]], orig.options.fr[orig.answer]);
  }
});

test("les options sont mélangées (la bonne réponse n'est pas toujours la première)", () => {
  const positions = new Set<number>();
  for (let i = 0; i < 30; i++) for (const v of Object.values(pickQuiz("fr").key)) positions.add(v);
  assert.ok(positions.size > 1);
});

test("scoreQuiz compte les bonnes réponses et ignore les doublons", () => {
  const key = { 1: 2, 2: 0 };
  assert.equal(scoreQuiz([{ id: 1, choice: 2 }], key), 1);
  assert.equal(scoreQuiz([{ id: 1, choice: 2 }, { id: 1, choice: 2 }], key), 1);
  assert.equal(scoreQuiz([{ id: 1, choice: 0 }], key), 0);
  assert.equal(scoreQuiz([{ id: 9999, choice: 0 }], key), 0);
});

test("scoreMemory rejette les parties impossibles et plafonne les points", () => {
  assert.equal(scoreMemory(MEMORY_PAIRS - 1, 30, 40), 0);
  assert.equal(scoreMemory(MEMORY_PAIRS, 3, 40), 0);
  assert.equal(scoreMemory(MEMORY_PAIRS, 20, 40), 40);
  assert.ok(scoreMemory(30, 120, 40) >= 5);
  assert.ok(scoreMemory(30, 120, 40) < 40);
});

test("la roue renvoie un segment valide", () => {
  for (const r of [0, 0.25, 0.5, 0.9999]) {
    const i = spinWheel(r);
    assert.ok(i >= 0 && i < WHEEL_SEGMENTS.length);
  }
  assert.equal(Math.max(...wheelValues(100)), 100);
});

import { applySwaps, isSolved, minSwaps, scorePuzzle, shufflePuzzle } from "../src/lib/games";

test("puzzle : mélange non résolu, toutes les pièces présentes", () => {
  for (const size of [3, 4]) {
    for (let k = 0; k < 50; k++) {
      const p = shufflePuzzle(size);
      assert.equal(p.length, size * size);
      assert.equal(new Set(p).size, size * size);
      assert.equal(isSolved(p), false);
    }
  }
});

test("puzzle : rejouer les échanges et compter le minimum", () => {
  const p = [1, 0, 2, 3, 4, 5, 6, 8, 7];
  assert.equal(minSwaps(p), 2);
  const solved = applySwaps(p, [[0, 1], [7, 8]]);
  assert.ok(solved && isSolved(solved));
  assert.equal(applySwaps(p, [[0, 0]]), null);
  assert.equal(applySwaps(p, [[0, 99]]), null);
  // Résolution générique par sélection : toujours possible
  const q = shufflePuzzle(4);
  const swaps: [number, number][] = [];
  const cur = [...q];
  for (let i = 0; i < cur.length; i++) {
    const j = cur.indexOf(i);
    if (j !== i) { swaps.push([i, j]); [cur[i], cur[j]] = [cur[j], cur[i]]; }
  }
  assert.ok(isSolved(applySwaps(q, swaps)!));
  assert.equal(swaps.length, minSwaps(q));
});

test("puzzle : points plafonnés, parties trop rapides refusées", () => {
  assert.equal(scorePuzzle(3, 7, 7, 20, 30), 30);
  assert.equal(scorePuzzle(4, 14, 14, 40, 30), 45);
  assert.equal(scorePuzzle(3, 7, 7, 2, 30), 0);
  assert.equal(scorePuzzle(3, 5, 7, 20, 30), 0);
  assert.ok(scorePuzzle(3, 40, 7, 300, 30) >= 5);
});

import { pickWeighted } from "../src/lib/draws";

test("tirage pondéré par le nombre de tickets", () => {
  const entries = [{ id: "a", tickets: 1 }, { id: "b", tickets: 0 }, { id: "c", tickets: 3 }];
  assert.equal(pickWeighted(entries, 0)?.id, "a");
  assert.equal(pickWeighted(entries, 0.24)?.id, "a");
  assert.equal(pickWeighted(entries, 0.25)?.id, "c");
  assert.equal(pickWeighted(entries, 0.9999)?.id, "c");
  assert.equal(pickWeighted([{ id: "x", tickets: 0 }], 0.5), null);
  const counts: Record<string, number> = { a: 0, c: 0 };
  for (let i = 0; i < 4000; i++) counts[pickWeighted(entries, Math.random())!.id]++;
  assert.ok(counts.c > counts.a * 2, JSON.stringify(counts));
});
