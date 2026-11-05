"use client";
import { useFormState } from "react-dom";
import { register } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { useT } from "@/lib/i18n/client";

export function RegisterForm({ defaultRole, defaultReferral }: { defaultRole: string; defaultReferral?: string }) {
  const { t } = useT();
  const [state, action] = useFormState(register, undefined);
  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className="label">{t("auth.accountType")}</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["USER", "MERCHANT"] as const).map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 p-3 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="role" value={r} defaultChecked={defaultRole === r} />
              {r === "USER" ? t("auth.asUser") : t("auth.asMerchant")}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label className="label" htmlFor="name">{t("auth.name")}</label>
        <input id="name" name="name" required minLength={2} className="input" autoComplete="name" />
      </div>
      <div>
        <label className="label" htmlFor="email">{t("common.email")}</label>
        <input id="email" name="email" type="email" required className="input" autoComplete="email" />
      </div>
      <div>
        <label className="label" htmlFor="phone">{t("common.phone")}</label>
        <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" placeholder="+216 …" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("auth.password")}</label>
        <input id="password" name="password" type="password" required minLength={8} className="input" autoComplete="new-password" />
      </div>
      <div>
        <label className="label" htmlFor="referral">{t("auth.referralCode")}</label>
        <input id="referral" name="referral" defaultValue={defaultReferral} className="input uppercase" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton className="btn-primary w-full">{t("auth.submitRegister")}</SubmitButton>
    </form>
  );
}
