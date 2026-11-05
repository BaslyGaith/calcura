"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/client";

/** Barre d'onglets en bas de l'écran sur mobile, comme une application. */
export function BottomNav({ loggedIn }: { loggedIn: boolean }) {
  const { t } = useT();
  const path = usePathname();
  const tabs = [
    { href: "/", icon: "🗺️", label: t("nav.map"), active: path === "/" },
    { href: "/explore", icon: "🔎", label: t("nav.explore"), active: path.startsWith("/explore") || path.startsWith("/discover") || path.startsWith("/venues") },
    { href: "/games", icon: "🎮", label: t("nav.games"), active: path.startsWith("/games") },
    { href: "/draws", icon: "🎟️", label: t("nav.draws"), active: path.startsWith("/draws") || path.startsWith("/rewards") },
    { href: loggedIn ? "/me" : "/login", icon: "👤", label: loggedIn ? t("nav.meShort") : t("nav.login"), active: path.startsWith("/me") || path.startsWith("/login") },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[1100] border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      <ul className="grid h-16 grid-cols-5">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link href={tab.href} aria-current={tab.active ? "page" : undefined} className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${tab.active ? "text-brand-600" : "text-stone-500"}`}>
              <span className={`grid h-8 w-12 place-items-center rounded-full text-lg transition ${tab.active ? "bg-brand-100" : ""}`}>{tab.icon}</span>
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
