import type { Metadata, Viewport } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Header } from "@/components/Header";
import { I18nProvider } from "@/lib/i18n/client";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: { default: "Bon Plan — Cafés & restaurants en Tunisie", template: "%s · Bon Plan" },
  description: "Menus en photos, adresses, jeux et bons d'achat dans les cafés et restaurants des 24 gouvernorats de Tunisie.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#e8501f", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { t, locale, dict } = getT();
  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        <I18nProvider locale={locale} dict={dict}>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="mt-12 border-t border-stone-200 bg-white py-6 text-center text-xs text-stone-500">
            <p>{t("footer.rights", { y: new Date().getFullYear() })}</p>
            <p className="mt-1">
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">{t("footer.osm")}</a>
            </p>
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
