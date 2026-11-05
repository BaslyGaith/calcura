"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackVenueView } from "@/app/actions/views";

export function ViewTracker({ venueId }: { venueId: string }) {
  const from = useSearchParams().get("from");
  const fromGame = from === "quiz" || from === "puzzle";
  useEffect(() => {
    trackVenueView(venueId, fromGame).catch(() => {});
  }, [venueId, fromGame]);
  return null;
}
