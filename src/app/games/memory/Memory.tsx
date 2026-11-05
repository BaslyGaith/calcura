"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startMemory, submitMemory } from "@/app/actions/games";
import { MEMORY_SYMBOLS } from "@/lib/games";
import { useT } from "@/lib/i18n/client";

type Card = { id: number; sym: string; matched: boolean };

function deck(): Card[] {
  return [...MEMORY_SYMBOLS, ...MEMORY_SYMBOLS].sort(() => Math.random() - 0.5).map((sym, id) => ({ id, sym, matched: false }));
}

export function Memory() {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [token, setToken] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<{ points: number; seconds: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const h = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(h);
  }, [token]);

  const begin = () => start(async () => {
    setError(null); setResult(null);
    const r = await startMemory();
    if (!r.ok) return setError(r.error);
    setToken(r.token); setCards(deck()); setFlipped([]); setMoves(0); setT0(Date.now()); setNow(Date.now());
  });

  function flip(idx: number) {
    if (!token || flipped.length === 2 || flipped.includes(idx) || cards[idx].matched) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (cards[a].sym === cards[b].sym) {
        const updated = cards.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
        setTimeout(() => {
          setCards(updated);
          setFlipped([]);
          if (updated.every((c) => c.matched)) finish(moves + 1);
        }, 300);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  }

  function finish(totalMoves: number) {
    const tk = token;
    setToken(null);
    start(async () => {
      if (!tk) return;
      const r = await submitMemory(tk, totalMoves);
      if (r.ok) { setResult(r); router.refresh(); } else setError(r.error);
    });
  }

  return (
    <div className="card p-6">
      <h1 className="h1 mb-4">🃏 {t("games.memory")}</h1>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {result && (
        <div className="mb-4 rounded-xl bg-lime-50 p-4 text-center">
          <p>{t("games.moves", { n: moves })} · {t("games.time", { n: result.seconds })}</p>
          <p className="text-2xl font-extrabold text-olive-600">{t("games.won", { n: result.points })}</p>
        </div>
      )}
      {token ? (
        <>
          <div className="mb-3 flex justify-between text-sm font-semibold text-stone-600">
            <span>{t("games.moves", { n: moves })}</span>
            <span>{t("games.time", { n: Math.max(0, Math.round((now - t0) / 1000)) })}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cards.map((c, i) => {
              const shown = c.matched || flipped.includes(i);
              return (
                <button key={c.id} onClick={() => flip(i)} aria-label={shown ? c.sym : "?"}
                  className={`aspect-square rounded-xl text-3xl transition sm:text-4xl ${shown ? (c.matched ? "bg-lime-100" : "bg-white ring-2 ring-brand-400") : "bg-gradient-to-br from-brand-500 to-amber-400 text-white"}`}>
                  {shown ? c.sym : "?"}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <button className="btn-primary" onClick={begin} disabled={pending}>{result ? t("games.again") : t("games.start")}</button>
          <Link href="/games" className="btn-secondary">{t("games.backToGames")}</Link>
        </div>
      )}
    </div>
  );
}
