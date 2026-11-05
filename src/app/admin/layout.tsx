import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser(["ADMIN"]);
  const { t } = getT();
  const links = [
    ["/admin", t("admin.dashboard")],
    ["/admin/merchants", t("admin.merchants")],
    ["/admin/venues", t("admin.venues")],
    ["/admin/users", t("admin.users")],
    ["/admin/reviews", t("admin.reviews")],
    ["/admin/settings", t("admin.settings")],
  ];
  return (
    <div className="container-bp py-6">
      <h1 className="h1 mb-4">🛡️ {t("admin.title")}</h1>
      <nav className="mb-6 flex flex-wrap gap-2">
        {links.map(([href, label]) => <Link key={href} href={href} className="btn-secondary btn-sm">{label}</Link>)}
      </nav>
      {children}
    </div>
  );
}
