import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { logout } from "@/app/actions/auth";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const user = await getCurrentUser();
  const { t } = getT();
  const links = [
    { href: "/", label: t("nav.map") },
    { href: "/discover", label: t("nav.discover") },
    { href: "/explore", label: t("nav.explore") },
    { href: "/games", label: t("nav.games") },
    { href: "/draws", label: t("nav.draws") },
    { href: "/rewards", label: t("nav.rewards") },
    { href: "/leaderboard", label: t("nav.leaderboard") },
  ];
  if (user?.role === "MERCHANT") links.push({ href: "/merchant", label: t("nav.merchant") });
  if (user?.role === "ADMIN") links.push({ href: "/admin", label: t("nav.admin") });

  return (
    <header className="sticky top-0 z-[1000] border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="container-bp flex h-14 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-600">
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500 text-white">BP</span>
          {t("app.name")}
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-sm font-medium text-stone-600 hover:bg-orange-50 hover:text-brand-600">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link href="/me" className="hidden items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold hover:bg-orange-50 sm:flex">
                <span className="badge bg-amber-100 text-amber-800">⭐ {user.points}</span>
                <span className="max-w-[8rem] truncate">{user.name}</span>
              </Link>
              <form action={logout} className="hidden sm:block">
                <button className="btn-secondary btn-sm">{t("nav.logout")}</button>
              </form>
            </>
          ) : (
            <div className="hidden gap-2 sm:flex">
              <Link href="/login" className="btn-secondary btn-sm">{t("nav.login")}</Link>
              <Link href="/register" className="btn-primary btn-sm">{t("nav.register")}</Link>
            </div>
          )}
          <MobileNav
            links={[...links, user ? { href: "/me", label: `${t("nav.me")} (⭐ ${user.points})` } : { href: "/login", label: t("nav.login") }, ...(user ? [] : [{ href: "/register", label: t("nav.register") }])]}
            logoutLabel={user ? t("nav.logout") : null}
          />
        </div>
      </div>
    </header>
  );
}
