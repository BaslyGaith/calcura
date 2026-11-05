"use client";
import dynamic from "next/dynamic";

export const NearbyExplorerLazy = dynamic(() => import("./NearbyExplorer"), {
  ssr: false,
  loading: () => <div className="h-[calc(100dvh-3.5rem-4rem)] animate-pulse bg-[#f2efe9] lg:h-[calc(100dvh-3.5rem)]" />,
});
