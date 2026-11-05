"use client";
import { useTransition } from "react";
import { cancelVoucher } from "@/app/actions/rewards";

export function CancelVoucher({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  return <button className="text-xs text-stone-500 underline" disabled={pending} onClick={() => start(() => cancelVoucher(id))}>{label}</button>;
}
