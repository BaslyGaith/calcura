"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startQuiz, submitQuiz } from "@/app/actions/games";
import { useT } from "@/lib/i18n/client";

type Q = { id: number; q: string; options: string[]; venue?: { id: string; name: string; city: string | null; image: string | null } };

export function Quiz() {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [game, setGame] = useState<{ token: string; questions: Q[] } | null>(null);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<{ correct: number; total: number; points: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [featured, setFeatured] = useState<NonNullable<Q["venue"]>[]>([]);

  const begin = () => start(async () => {
    setError(null); setResult(null); setAnswers({}); setI(0);
    const r = await startQuiz();
    if (r.ok) setGame({ token: r.token, questions: r.questions }); else setError(r.error);
  });

  const finish = () => start(async () => {
    if (!game) return;
    const r = await submitQuiz(game.token, Object.entries(answers).map(([id, choice]) => ({ id: Number(id), choice })));
    if (r.ok) {
      setFeatured(game.questions.flatMap((q) => (q.venue ? [q.venue] : [])));
      setResult(r); setGame(null); router.refresh();
    } else setError(r.error);
  });

  return (
    <div className="card p-6">
      <h1 className="h1">🧠 {t("games.quiz")}</h1>
      <p className="mb-4 mt-1 text-sm text-stone-600">{t("games.quiz.menuDesc")}</p>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      {result && (
        <div className="mb-4 rounded-xl bg-lime-50 p-4 text-center">
          <p className="text-lg font-semibold">{t("games.correct", { c: result.correct, n: result.total })}</p>
          <p className="text-2xl font-extrabold text-olive-600">{t("games.won", { n: result.points })}</p>
        </div>
      )}
      {result && featured.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 font-bold">{t("games.discover")}</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {featured.map((v) => <VenueChip key={v.id} v={v} label={t("games.seeMenu")} />)}
          </div>
        </div>
      )}
      {!game ? (
        <div className="flex gap-2">
          <button className="btn-primary" onClick={begin} disabled={pending}>{result ? t("games.again") : t("games.start")}</button>
          <Link href="/games" className="btn-secondary">{t("games.backToGames")}</Link>
        </div>
      ) : (
        <div>
          <p className="text-sm text-stone-500">{t("games.question", { i: i + 1, n: game.questions.length })}</p>
          <div className="mb-4 mt-1 h-2 rounded-full bg-stone-100"><div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${((i + 1) / game.questions.length) * 100}%` }} /></div>
          {game.questions[i].venue && (
            <div className="mb-3">
              <VenueChip v={game.questions[i].venue!} label={t("games.seeMenu")} />
              <p className="mt-1 text-xs text-stone-500">💡 {t("games.hint")}</p>
            </div>
          )}
          <h2 className="mb-4 text-lg font-semibold">{game.questions[i].q}</h2>
          <div className="grid gap-2">
            {game.questions[i].options.map((o, k) => {
              const qid = game.questions[i].id;
              const selected = answers[qid] === k;
              return (
                <button key={k} className={`rounded-xl border p-3 text-left transition ${selected ? "border-brand-500 bg-brand-50 font-semibold" : "border-stone-200 hover:bg-stone-50"}`}
                  onClick={() => { setAnswers((a) => ({ ...a, [qid]: k })); if (i < game.questions.length - 1) setTimeout(() => setI(i + 1), 250); }}>
                  {o}
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-between">
            <button className="btn-secondary" disabled={i === 0} onClick={() => setI(i - 1)}>←</button>
            {i < game.questions.length - 1 ? (
              <button className="btn-secondary" onClick={() => setI(i + 1)}>→</button>
            ) : (
              <button className="btn-primary" disabled={pending || Object.keys(answers).length < game.questions.length} onClick={finish}>{t("games.submit")}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function VenueChip({ v, label }: { v: NonNullable<Q["venue"]>; label: string }) {
  return (
    <a href={`/venues/${v.id}?from=quiz`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-stone-200 bg-orange-50/60 p-2 hover:border-brand-300">
      {v.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={v.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
      ) : <span className="grid h-12 w-12 place-items-center rounded-lg bg-white text-2xl">🍽️</span>}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{v.name}</span>
        {v.city && <span className="block text-xs text-stone-500">{v.city}</span>}
      </span>
      <span className="whitespace-nowrap text-xs font-semibold text-brand-600">{label}</span>
    </a>
  );
}
