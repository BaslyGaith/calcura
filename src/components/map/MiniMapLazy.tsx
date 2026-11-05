"use client";
import dynamic from "next/dynamic";

export const MiniMapLazy = dynamic(() => import("./MiniMap"), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-2xl bg-stone-100" />,
});
