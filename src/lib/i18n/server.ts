import { cookies } from "next/headers";
import { DEFAULT_LOCALE, dictionaries, translate, type DictKey, type Locale } from "./dictionaries";

export function getLocale(): Locale {
  const v = cookies().get("locale")?.value;
  return v === "en" || v === "fr" ? v : DEFAULT_LOCALE;
}

export function getT() {
  const locale = getLocale();
  const dict = dictionaries[locale];
  const t = (key: DictKey, vars?: Record<string, string | number>) => translate(dict, key, vars);
  return { t, locale, dict };
}

export type T = ReturnType<typeof getT>["t"];
