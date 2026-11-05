import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const { t } = getT();
  return (
    <div className="container-bp flex justify-center py-10">
      <div className="card w-full max-w-md p-6">
        <h1 className="h1 mb-6">{t("auth.loginTitle")}</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-stone-600">
          {t("auth.noAccount")} <Link href="/register" className="font-semibold text-brand-600">{t("nav.register")}</Link>
        </p>
        <div className="mt-6 rounded-xl bg-stone-50 p-3 text-xs text-stone-600">
          <p className="mb-1 font-semibold">{t("auth.demoAccounts")}</p>
          <ul className="space-y-0.5 font-mono">
            <li>admin@bonplan.tn / Admin123!</li>
            <li>commercant@bonplan.tn / Demo1234!</li>
            <li>user@bonplan.tn / Demo1234!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
