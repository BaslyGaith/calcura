"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { spin } from "@/app/actions/games";
import { useT } from "@/lib/i18n/client";

const COLORS = ["#e8501f", "#f59e0b", "#5b7a3a", "#0ea5e9", "#a21caf", "#78350f", "#dc2626", "#16a34a"];

export function Wheel({ values }: { values: number[] }) {
  const { t } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const n = values.length;
  const seg = 360 / n;

  const go = () => start(async () => {
    setError(null); setResult(null);
    const r = await spin();
    if (!r.ok) return setError(r.error);
    // Le segment i est centré à i*seg + seg/2 ; le pointeur est en haut (0°).
    const target = 360 * 6 + (360 - (r.index * seg + seg / 2));
    setSpinning(true);
    setAngle((a) => a - (a % 360) + target);
    setTimeout(() => { setSpinning(false); setResult(r.points); router.refresh(); }, 4200);
  });

  const r = 140;
  const paths = values.map((v, i) => {
    const a0 = ((i * seg - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
    const mid = (((i + 0.5) * seg - 90) * Math.PI) / 180;
    return {
      d: `M150,150 L${150 + r * Math.cos(a0)},${150 + r * Math.sin(a0)} A${r},${r} 0 0,1 ${150 + r * Math.cos(a1)},${150 + r * Math.sin(a1)} Z`,
      tx: 150 + r * 0.65 * Math.cos(mid), ty: 150 + r * 0.65 * Math.sin(mid), rot: (i + 0.5) * seg, v, color: COLORS[i % COLORS.length],
    };
  });

  return (
    <div className="card p-6 text-center">
      <h1 className="h1 mb-4">🎡 {t("games.wheel")}</h1>
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="relative mx-auto w-full max-w-xs">
        <div className="absolute left-1/2 top-[-6px] z-10 h-0 w-0 -translate-x-1/2 border-x-[12px] border-t-[22px] border-x-transparent border-t-stone-900" />
        <svg viewBox="0 0 300 300" className="w-full" style={{ transform: `rotate(${angle}deg)`, transition: spinning ? "transform 4s cubic-bezier(.17,.67,.2,1)" : "none" }}>
          {paths.map((p, i) => (
            <g key={i}>
              <path d={p.d} fill={p.color} stroke="#fff" strokeWidth="2" />
              <text x={p.tx} y={p.ty} fill="#fff" fontSize="18" fontWeight="700" textAnchor="middle" dominantBaseline="middle" transform={`rotate(${p.rot} ${p.tx} ${p.ty})`}>{p.v}</text>
            </g>
          ))}
          <circle cx="150" cy="150" r="20" fill="#fff" stroke="#e8501f" strokeWidth="4" />
        </svg>
      </div>
      {result !== null && <p className="mt-4 text-2xl font-extrabold text-olive-600">{t("games.won", { n: result })}</p>}
      <div className="mt-6 flex justify-center gap-2">
        <button className="btn-primary" onClick={go} disabled={pending || spinning}>{spinning ? t("games.spinning") : t("games.spin")}</button>
        <Link href="/games" className="btn-secondary">{t("games.backToGames")}</Link>
      </div>
    </div>
  );
}
