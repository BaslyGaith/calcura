import type { Metadata, Viewport } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { FooterGate } from "@/components/FooterGate";
import { getCurrentUser } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n/client";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Bon Plan — Cafés & restaurants en Tunisie", template: "%s · Bon Plan" },
  description: "Menus en photos, adresses, jeux et bons d'achat dans les cafés et restaurants des 24 gouvernorats de Tunisie.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#e8501f", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, dict } = getT();
  const user = await getCurrentUser();
  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col pb-16 lg:pb-0">
        <I18nProvider locale={locale} dict={dict}>
          <Header />
          <main className="flex-1">{children}</main>
          <FooterGate>
          <footer className="mt-12 border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
            <p>{t("footer.rights", { y: new Date().getFullYear() })}</p>
            <p className="mt-1">
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">{t("footer.osm")}</a>
            </p>
          </footer>
          </FooterGate>
          <BottomNav loggedIn={!!user} />
        </I18nProvider>
      </body>
    </html>
  );
}
