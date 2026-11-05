"use client";
import { usePathname } from "next/navigation";

/** Masque le pied de page sur la carte plein écran. */
export function FooterGate({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
