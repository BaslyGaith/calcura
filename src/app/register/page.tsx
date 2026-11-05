import Link from "next/link";
import { getT } from "@/lib/i18n/server";
import { RegisterForm } from "./RegisterForm";

export default function RegisterPage({ searchParams }: { searchParams: { role?: string; ref?: string } }) {
  const { t } = getT();
  return (
    <div className="container-bp flex justify-center py-10">
      <div className="card w-full max-w-md p-6">
        <h1 className="h1 mb-6">{t("auth.registerTitle")}</h1>
        <RegisterForm defaultRole={searchParams.role === "merchant" ? "MERCHANT" : "USER"} defaultReferral={searchParams.ref} />
        <p className="mt-4 text-center text-sm text-stone-600">
          {t("auth.haveAccount")} <Link href="/login" className="font-semibold text-brand-600">{t("nav.login")}</Link>
        </p>
      </div>
    </div>
  );
}
