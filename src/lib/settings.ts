import { prisma } from "./db";

/** Paramètres configurables par l'admin, avec leurs valeurs par défaut. */
export const DEFAULT_SETTINGS = {
  subscriptionMonthly: 49,
  subscriptionYearly: 490,
  autoBlock: 1,
  gracePeriodDays: 3,
  dailyPlaysPerGame: 3,
  quizPointsPerAnswer: 5,
  quizMenuQuestions: 3, // questions tirées des menus des établissements (sur 5)
  quizSponsoredWeight: 5, // poids des établissements de commerçants abonnés dans le quiz
  memoryMaxPoints: 40,
  wheelMaxPoints: 100,
  reviewPoints: 10,
  referralPoints: 50,
  signupPoints: 20,
  voucherValidityDays: 30,
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingKey = keyof Settings;
export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

export async function getSettings(): Promise<Settings> {
  const rows = await prisma.setting.findMany();
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const r of rows) {
    if (r.key in s) {
      const n = Number(r.value);
      if (Number.isFinite(n)) s[r.key as SettingKey] = n;
    }
  }
  return s;
}

export async function setSetting(key: SettingKey, value: number) {
  await prisma.setting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}
