"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";

/** Demande la position du navigateur et l'ajoute à l'URL (?lat=&lng=&sort=distance). */
export function LocationButton({ target, className = "btn-secondary" }: { target?: string; className?: string }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const active = params.has("lat") && params.has("lng");

  function locate() {
    if (!navigator.geolocation) return setState("error");
    setState("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = new URLSearchParams(target ? "" : params.toString());
        p.set("lat", pos.coords.latitude.toFixed(5));
        p.set("lng", pos.coords.longitude.toFixed(5));
        p.set("sort", "distance");
        p.delete("page");
        setState("idle");
        router.push(`${target ?? pathname}?${p.toString()}`);
      },
      () => setState("error"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <div className="flex flex-col">
      <button type="button" onClick={locate} className={className} disabled={state === "loading"}>
        📍 {state === "loading" ? t("home.locating") : active && !target ? t("explore.locationOn") : target ? t("home.nearMe") : t("explore.useLocation")}
      </button>
      {state === "error" && <span className="mt-1 text-xs text-red-600">{t("explore.locationDenied")}</span>}
    </div>
  );
}
