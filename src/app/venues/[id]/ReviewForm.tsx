"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { submitReview } from "@/app/actions/venue";
import { SubmitButton } from "@/components/SubmitButton";
import { useT } from "@/lib/i18n/client";

export function ReviewForm({ venueId, initial, points }: { venueId: string; initial?: { rating: number; comment: string | null }; points: number }) {
  const { t } = useT();
  const [state, action] = useFormState(submitReview, undefined);
  const [rating, setRating] = useState(initial?.rating ?? 5);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="rating" value={rating} />
      <div>
        <span className="label">{t("venue.rating")}</span>
        <div className="flex gap-1 text-2xl" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}`} onClick={() => setRating(n)} className={n <= rating ? "text-amber-500" : "text-stone-300"}>★</button>
          ))}
        </div>
      </div>
      <textarea name="comment" defaultValue={initial?.comment ?? ""} rows={3} maxLength={1000} placeholder={t("venue.comment")} className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-olive-600">{state.ok}</p>}
      <SubmitButton>{initial ? t("common.save") : t("venue.sendReview", { n: points })}</SubmitButton>
    </form>
  );
}
