"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackVenueView } from "@/app/actions/views";

export function ViewTracker({ venueId }: { venueId: string }) {
  const fromQuiz = useSearchParams().get("from") === "quiz";
  useEffect(() => {
    trackVenueView(venueId, fromQuiz).catch(() => {});
  }, [venueId, fromQuiz]);
  return null;
}
