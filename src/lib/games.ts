// Contenu et règles des mini-jeux. Les points sont toujours calculés côté serveur.

export type GameId = "PUZZLE" | "QUIZ" | "MEMORY" | "WHEEL";
export const GAMES: GameId[] = ["PUZZLE", "QUIZ", "MEMORY", "WHEEL"];

export type QuizQuestion = {
  id: number;
  q: { fr: string; en: string };
  options: { fr: string[]; en: string[] };
  answer: number; // index de la bonne réponse (jamais envoyé au client)
};

export const QUIZ_BANK: QuizQuestion[] = [
  { id: 1, q: { fr: "Quel est le plat national tunisien à base de semoule ?", en: "Which semolina dish is Tunisia's national dish?" },
    options: { fr: ["Le couscous", "La paëlla", "Le risotto", "Le tajine marocain"], en: ["Couscous", "Paella", "Risotto", "Moroccan tagine"] }, answer: 0 },
  { id: 2, q: { fr: "La harissa est une pâte de…", en: "Harissa is a paste made of…" },
    options: { fr: ["Piment", "Pois chiches", "Dattes", "Olives"], en: ["Chili pepper", "Chickpeas", "Dates", "Olives"] }, answer: 0 },
  { id: 3, q: { fr: "Combien de gouvernorats compte la Tunisie ?", en: "How many governorates does Tunisia have?" },
    options: { fr: ["18", "24", "30", "12"], en: ["18", "24", "30", "12"] }, answer: 1 },
  { id: 4, q: { fr: "Le « brik » est une feuille croustillante souvent garnie de…", en: "A \"brik\" is a crispy pastry often filled with…" },
    options: { fr: ["Œuf", "Chocolat", "Fraise", "Riz"], en: ["Egg", "Chocolate", "Strawberry", "Rice"] }, answer: 0 },
  { id: 5, q: { fr: "Le « lablabi » est une soupe de…", en: "\"Lablabi\" is a soup made of…" },
    options: { fr: ["Lentilles", "Pois chiches", "Tomates", "Poisson"], en: ["Lentils", "Chickpeas", "Tomatoes", "Fish"] }, answer: 1 },
  { id: 6, q: { fr: "Quelle ville est célèbre pour ses dattes Deglet Nour ?", en: "Which town is famous for Deglet Nour dates?" },
    options: { fr: ["Bizerte", "Tozeur", "Tabarka", "Nabeul"], en: ["Bizerte", "Tozeur", "Tabarka", "Nabeul"] }, answer: 1 },
  { id: 7, q: { fr: "Le thé tunisien est souvent servi avec des…", en: "Tunisian tea is often served with…" },
    options: { fr: ["Pignons de pin", "Raisins secs", "Amandes salées", "Noix de coco"], en: ["Pine nuts", "Raisins", "Salted almonds", "Coconut"] }, answer: 0 },
  { id: 8, q: { fr: "La « kafteji » est un plat de…", en: "\"Kafteji\" is a dish of…" },
    options: { fr: ["Légumes frits", "Pâtes", "Poulet rôti", "Fruits de mer"], en: ["Fried vegetables", "Pasta", "Roast chicken", "Seafood"] }, answer: 0 },
  { id: 9, q: { fr: "Quelle ville est connue pour sa céramique et sa poterie ?", en: "Which town is known for its ceramics and pottery?" },
    options: { fr: ["Nabeul", "Gafsa", "Kébili", "Siliana"], en: ["Nabeul", "Gafsa", "Kebili", "Siliana"] }, answer: 0 },
  { id: 10, q: { fr: "Le « bambalouni » est un beignet typique de…", en: "\"Bambalouni\" is a doughnut typical of…" },
    options: { fr: ["Sidi Bou Saïd", "Tataouine", "Le Kef", "Béja"], en: ["Sidi Bou Said", "Tataouine", "Kef", "Beja"] }, answer: 0 },
  { id: 11, q: { fr: "La « mloukhia » est préparée avec de la poudre de…", en: "\"Mloukhia\" is made with powdered…" },
    options: { fr: ["Corète", "Cacao", "Café", "Cannelle"], en: ["Jute leaves", "Cocoa", "Coffee", "Cinnamon"] }, answer: 0 },
  { id: 12, q: { fr: "Quel est le café traditionnel servi dans les cafés tunisiens ?", en: "Which traditional coffee is served in Tunisian cafés?" },
    options: { fr: ["Le café turc (kahwa arbi)", "Le cappuccino glacé", "Le café filtre", "Le café viennois"], en: ["Turkish coffee (kahwa arbi)", "Iced cappuccino", "Filter coffee", "Viennese coffee"] }, answer: 0 },
  { id: 13, q: { fr: "La « chakchouka » contient principalement…", en: "\"Shakshuka\" mainly contains…" },
    options: { fr: ["Poivrons, tomates et œufs", "Riz et lait", "Bœuf et pommes", "Pâtes et crème"], en: ["Peppers, tomatoes and eggs", "Rice and milk", "Beef and apples", "Pasta and cream"] }, answer: 0 },
  { id: 14, q: { fr: "Djerba fait partie du gouvernorat de…", en: "Djerba belongs to the governorate of…" },
    options: { fr: ["Médenine", "Gabès", "Sfax", "Mahdia"], en: ["Medenine", "Gabes", "Sfax", "Mahdia"] }, answer: 0 },
  { id: 15, q: { fr: "L'« assida zgougou » est préparée pour…", en: "\"Assida zgougou\" is prepared for…" },
    options: { fr: ["Le Mouled", "Le Nouvel An", "L'Aïd el-Kebir", "La rentrée"], en: ["Mawlid", "New Year", "Eid al-Adha", "Back to school"] }, answer: 0 },
];

export const QUIZ_LENGTH = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tire `n` questions au hasard et mélange leurs options. Renvoie les questions pour
 * le client (sans réponse) et la clé de correction (à garder côté serveur / chiffrée).
 */
export function pickQuiz(locale: "fr" | "en", n = QUIZ_LENGTH) {
  const picked = shuffle(QUIZ_BANK).slice(0, n);
  const key: Record<number, number> = {};
  const questions = picked.map((q) => {
    const order = shuffle(q.options[locale].map((_, i) => i));
    key[q.id] = order.indexOf(q.answer);
    return { id: q.id, q: q.q[locale], options: order.map((i) => q.options[locale][i]) };
  });
  return { questions, key };
}

/** Score du quiz : bonnes réponses parmi des questions distinctes présentes dans la clé. */
export function scoreQuiz(answers: { id: number; choice: number }[], key: Record<number, number>): number {
  const seen = new Set<number>();
  let correct = 0;
  for (const a of answers) {
    if (seen.has(a.id) || !(a.id in key)) continue;
    seen.add(a.id);
    if (key[a.id] === a.choice) correct++;
  }
  return correct;
}

export const MEMORY_SYMBOLS = ["☕", "🍕", "🥐", "🍔", "🥗", "🍰", "🍋", "🫖"];
export const MEMORY_PAIRS = MEMORY_SYMBOLS.length;

/** Points du memory : plafonnés, décroissent avec le nombre de coups et le temps. */
export function scoreMemory(moves: number, seconds: number, maxPoints: number): number {
  if (!Number.isFinite(moves) || !Number.isFinite(seconds)) return 0;
  // Impossible de finir en moins de MEMORY_PAIRS coups ou en moins de 8 s : partie suspecte.
  if (moves < MEMORY_PAIRS || seconds < 8) return 0;
  const movePenalty = Math.max(0, moves - MEMORY_PAIRS) * 1.5;
  const timePenalty = Math.max(0, seconds - 30) * 0.3;
  return Math.max(5, Math.round(maxPoints - movePenalty - timePenalty));
}

/** Segments de la roue en fraction du gain maximum, avec leurs poids de probabilité. */
export const WHEEL_SEGMENTS = [
  { ratio: 0.05, weight: 30 },
  { ratio: 0.1, weight: 25 },
  { ratio: 0.2, weight: 18 },
  { ratio: 0.3, weight: 12 },
  { ratio: 0.5, weight: 8 },
  { ratio: 0, weight: 4 },
  { ratio: 0.75, weight: 2 },
  { ratio: 1, weight: 1 },
];

export function wheelValues(maxPoints: number) {
  return WHEEL_SEGMENTS.map((s) => Math.round(s.ratio * maxPoints));
}

export function spinWheel(rand = Math.random()): number {
  const total = WHEEL_SEGMENTS.reduce((a, s) => a + s.weight, 0);
  let r = rand * total;
  for (let i = 0; i < WHEEL_SEGMENTS.length; i++) {
    r -= WHEEL_SEGMENTS[i].weight;
    if (r < 0) return i;
  }
  return WHEEL_SEGMENTS.length - 1;
}

// ---------- Puzzle photo de menu ----------
// La photo est découpée en size × size pièces mélangées ; le joueur échange deux pièces
// à la fois. perm[position] = pièce affichée à cette position ; résolu quand perm[i] === i.

export const PUZZLE_SIZES = [3, 4] as const;
export type PuzzleSize = (typeof PUZZLE_SIZES)[number];

/** Mélange aléatoire garanti différent de l'ordre résolu, sans pièce déjà bien placée si possible. */
export function shufflePuzzle(size: number, rand: () => number = Math.random): number[] {
  const n = size * size;
  for (let attempt = 0; attempt < 50; attempt++) {
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    const placed = p.filter((v, i) => v === i).length;
    if (placed <= 1) return p;
  }
  // Repli : décalage circulaire (aucune pièce à sa place).
  return Array.from({ length: n }, (_, i) => (i + 1) % n);
}

export function isSolved(perm: number[]): boolean {
  return perm.every((v, i) => v === i);
}

/** Rejoue une suite d'échanges ; renvoie null si un échange est invalide. */
export function applySwaps(perm: number[], swaps: [number, number][]): number[] | null {
  const p = [...perm];
  for (const s of swaps) {
    if (!Array.isArray(s) || s.length !== 2) return null;
    const [a, b] = s;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= p.length || b >= p.length || a === b) return null;
    [p[a], p[b]] = [p[b], p[a]];
  }
  return p;
}

/** Nombre minimal d'échanges pour résoudre (n − nombre de cycles). */
export function minSwaps(perm: number[]): number {
  const seen = new Array(perm.length).fill(false);
  let cycles = 0;
  for (let i = 0; i < perm.length; i++) {
    if (seen[i]) continue;
    cycles++;
    for (let j = i; !seen[j]; j = perm[j]) seen[j] = true;
  }
  return perm.length - cycles;
}

/** Durée minimale crédible (secondes) pour terminer un puzzle. */
export function puzzleMinSeconds(size: number) {
  return size >= 4 ? 12 : 6;
}

/**
 * Points du puzzle : plafond (×1,5 en 4×4), moins une pénalité pour les échanges
 * inutiles et le temps au-delà d'un seuil. Minimum 5 points pour un puzzle résolu.
 */
export function scorePuzzle(size: number, moves: number, optimal: number, seconds: number, maxPoints: number): number {
  if (seconds < puzzleMinSeconds(size) || moves < optimal) return 0;
  const cap = Math.round(maxPoints * (size >= 4 ? 1.5 : 1));
  const extra = (moves - optimal) * 1;
  const slow = Math.max(0, seconds - (size >= 4 ? 120 : 60)) * 0.2;
  return Math.max(5, Math.round(cap - extra - slow));
}
