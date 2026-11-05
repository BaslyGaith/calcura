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
