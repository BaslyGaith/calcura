"use client";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startPuzzle, submitPuzzle } from "@/app/actions/games";
import { useT } from "@/lib/i18n/client";

type Game = {
  token: string;
  size: number;
  image: string;
  venue: { id: string; name: string; city: string | null; type: string };
};

function tileStyle(image: string, piece: number, size: number): React.CSSProperties {
  const row = Math.floor(piece / size);
  const col = piece % size;
  return {
    backgroundImage: `url(${JSON.stringify(image)})`,
    backgroundSize: `${size * 100}% ${size * 100}%`,
    backgroundPosition: `${(col / (size - 1)) * 100}% ${(row / (size - 1)) * 100}%`,
  };
}

export function Puzzle() {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [size, setSize] = useState(3);
  const [game, setGame] = useState<Game | null>(null);
  const [tiles, setTiles] = useState<number[]>([]);
  const [swaps, setSwaps] = useState<[number, number][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [ratio, setRatio] = useState(1);
  const [preview, setPreview] = useState(false);
  const [solved, setSolved] = useState(false);
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<{ points: number; seconds: number; moves: number; tickets: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Proportions réelles de la photo, pour ne pas la déformer.
  useEffect(() => {
    if (!game) return;
    const img = new Image();
    img.onload = () => setRatio(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
    img.src = game.image;
  }, [game]);

  useEffect(() => {
    if (!game || solved) return;
    const h = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(h);
  }, [game, solved]);

  const begin = () =>
    start(async () => {
      setError(null); setResult(null); setSolved(false); setSelected(null); setSwaps([]); setPreview(false);
      const r = await startPuzzle(size);
      if (!r.ok) return setError(r.error);
      setGame({ token: r.token, size: r.size, image: r.image, venue: r.venue });
      setTiles(r.perm);
      setT0(Date.now()); setNow(Date.now());
    });

  function tap(pos: number) {
    if (!game || solved || pending) return;
    if (selected === null) return setSelected(pos);
    if (selected === pos) return setSelected(null);
    const next = [...tiles];
    [next[selected], next[pos]] = [next[pos], next[selected]];
    const nextSwaps: [number, number][] = [...swaps, [selected, pos]];
    setTiles(next);
    setSwaps(nextSwaps);
    setSelected(null);
    if (next.every((v, i) => v === i)) {
      setSolved(true);
      const token = game.token;
      start(async () => {
        const r = await submitPuzzle(token, nextSwaps);
        if (r.ok) { setResult(r); router.refresh(); } else setError(r.error);
      });
    }
  }

  const venueLink = game ? `/venues/${game.venue.id}?from=puzzle` : "#";

  return (
    <div className="card p-6">
      <h1 className="h1">🧩 {t("games.puzzle")}</h1>
      <p className="mb-4 mt-1 text-sm text-stone-600">{t("games.puzzle.desc")}</p>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

      {game && (
        <>
          <a href={venueLink} target="_blank" rel="noreferrer" className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-orange-50/60 px-3 py-2 hover:border-brand-300">
            <span className="min-w-0">
              <span className="block text-xs text-stone-500">{t("games.puzzle.from")}</span>
              <span className="block truncate font-semibold">{game.venue.type === "CAFE" ? "☕" : "🍽️"} {game.venue.name}{game.venue.city ? ` · ${game.venue.city}` : ""}</span>
            </span>
            <span className="whitespace-nowrap text-xs font-semibold text-brand-600">{t("games.seeMenu")}</span>
          </a>
          <div className="mb-2 flex items-center justify-between text-sm font-semibold text-stone-600">
            <span>{t("games.moves", { n: swaps.length })}</span>
            {!solved && <button type="button" className="text-xs text-brand-600 underline" onClick={() => setPreview((p) => !p)}>{preview ? t("games.puzzle.hidePreview") : t("games.puzzle.preview")}</button>}
            <span>{t("games.time", { n: Math.max(0, Math.round(((result ? t0 + result.seconds * 1000 : now) - t0) / 1000)) })}</span>
          </div>
          <div className="relative mx-auto w-full max-w-md" style={{ aspectRatio: String(ratio) }}>
            {solved || preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.image} alt={game.venue.name} className={`h-full w-full rounded-xl object-fill ${solved ? "ring-4 ring-olive-500" : "opacity-95"}`} />
            ) : (
              <div className="grid h-full w-full gap-[2px] overflow-hidden rounded-xl bg-stone-300" style={{ gridTemplateColumns: `repeat(${game.size}, 1fr)` }}>
                {tiles.map((piece, pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => tap(pos)}
                    aria-label={`${pos + 1}`}
                    aria-pressed={selected === pos}
                    className={`bg-white transition ${selected === pos ? "z-10 scale-95 ring-4 ring-brand-500" : "hover:brightness-110"}`}
                    style={tileStyle(game.image, piece, game.size)}
                  />
                ))}
              </div>
            )}
          </div>
          {!solved && <p className="mt-2 text-center text-xs text-stone-500">{t("games.puzzle.howTo")}</p>}
        </>
      )}

      {result && (
        <div className="mt-4 rounded-xl bg-lime-50 p-4 text-center">
          <p className="font-semibold">✅ {t("games.puzzle.solved")} {t("games.moves", { n: result.moves })} · {t("games.time", { n: result.seconds })}</p>
          {result.points > 0
            ? <p className="text-2xl font-extrabold text-olive-600">{t("games.won", { n: result.points })}</p>
            : <p className="mt-1 text-sm font-semibold text-amber-800">{t("games.puzzle.tooFast")}</p>}
          {result.tickets > 0 && <p className="mt-1 font-semibold text-brand-700">{t("games.ticketsWon", { n: result.tickets })}</p>}
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <a href={venueLink} target="_blank" rel="noreferrer" className="btn-secondary btn-sm">{t("games.seeMenu")}</a>
            <Link href="/draws" className="btn-success btn-sm">🎟️ {t("nav.draws")}</Link>
          </div>
        </div>
      )}

      {(!game || result) && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {[3, 4].map((s) => (
              <button key={s} type="button" role="radio" aria-checked={size === s} onClick={() => setSize(s)}
                className={`rounded-xl border px-3 py-2 text-sm ${size === s ? "border-brand-500 bg-brand-50 font-semibold" : "border-stone-200"}`}>
                {s === 3 ? t("games.puzzle.size3") : t("games.puzzle.size4")}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={begin} disabled={pending}>{result ? t("games.again") : t("games.start")}</button>
            <Link href="/games" className="btn-secondary">{t("games.backToGames")}</Link>
          </div>
        </div>
      )}
    </div>
  );
}
