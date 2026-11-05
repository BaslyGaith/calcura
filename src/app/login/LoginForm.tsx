"use client";
import { useFormState } from "react-dom";
import { login } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { useT } from "@/lib/i18n/client";

export function LoginForm() {
  const { t } = useT();
  const [state, action] = useFormState(login, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">{t("common.email")}</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">{t("auth.password")}</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">{state.error}</p>}
      <SubmitButton className="btn-primary w-full">{t("auth.submitLogin")}</SubmitButton>
    </form>
  );
}
