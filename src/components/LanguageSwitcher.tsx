"use client";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";
import { useT } from "@/lib/i18n/client";

export function LanguageSwitcher() {
  const { locale, t } = useT();
  const [pending, start] = useTransition();
  return (
    <div className="flex overflow-hidden rounded-lg border border-stone-300 text-xs font-semibold" aria-label={t("nav.language")}>
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          onClick={() => start(() => setLocale(l))}
          className={`px-2 py-1 uppercase ${locale === l ? "bg-brand-500 text-white" : "bg-white text-stone-600 hover:bg-stone-50"}`}
          aria-pressed={locale === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
