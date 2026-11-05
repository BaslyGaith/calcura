"use client";
import { createContext, useContext } from "react";
import { translate, type Dict, type DictKey, type Locale } from "./dictionaries";

const I18nContext = createContext<{ locale: Locale; dict: Dict } | null>(null);

export function I18nProvider({ locale, dict, children }: { locale: Locale; dict: Dict; children: React.ReactNode }) {
  return <I18nContext.Provider value={{ locale, dict }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used inside I18nProvider");
  const t = (key: DictKey, vars?: Record<string, string | number>) => translate(ctx.dict, key, vars);
  return { t, locale: ctx.locale };
}
