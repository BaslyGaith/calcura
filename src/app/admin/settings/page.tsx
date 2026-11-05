import { getT } from "@/lib/i18n/server";
import { getSettings, SETTING_KEYS } from "@/lib/settings";
import { saveSettings } from "@/app/actions/admin";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AdminSettings({ searchParams }: { searchParams: { saved?: string } }) {
  const { t } = getT();
  const s = await getSettings();
  return (
    <form action={saveSettings} className="card max-w-2xl space-y-4 p-6">
      {searchParams.saved && <p className="rounded-lg bg-lime-50 p-2 font-semibold text-olive-600">{t("common.saved")}</p>}
      {SETTING_KEYS.map((k) => (
        <div key={k} className="grid items-center gap-2 sm:grid-cols-[1fr_10rem]">
          <label htmlFor={k} className="text-sm font-medium">{t(`admin.setting.${k}` as DictKey)}</label>
          <input id={k} name={k} type="number" step="any" min={0} defaultValue={s[k]} className="input" />
        </div>
      ))}
      <button className="btn-primary">{t("common.save")}</button>
    </form>
  );
}
