"use client";
import { useState } from "react";

export type GalleryPhoto = { id: string; url: string; caption: string | null };

export function PhotoGallery({ photos, empty }: { photos: GalleryPhoto[]; empty: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (photos.length === 0) return <p className="text-sm text-stone-500">{empty}</p>;
  const cur = open !== null ? photos[open] : null;
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpen(i)} className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={p.caption ?? ""} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
            {p.caption && <span className="absolute inset-x-0 bottom-0 bg-black/50 px-2 py-1 text-left text-xs text-white">{p.caption}</span>}
          </button>
        ))}
      </div>
      {cur && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/85 p-4" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <button className="absolute right-4 top-4 text-3xl text-white" aria-label="Fermer" onClick={() => setOpen(null)}>×</button>
          {photos.length > 1 && (
            <>
              <button className="absolute left-2 text-4xl text-white" aria-label="Précédent" onClick={(e) => { e.stopPropagation(); setOpen((open! - 1 + photos.length) % photos.length); }}>‹</button>
              <button className="absolute right-2 text-4xl text-white" aria-label="Suivant" onClick={(e) => { e.stopPropagation(); setOpen((open! + 1) % photos.length); }}>›</button>
            </>
          )}
          <figure onClick={(e) => e.stopPropagation()} className="max-h-full max-w-4xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cur.url} alt={cur.caption ?? ""} className="max-h-[80vh] rounded-lg object-contain" />
            {cur.caption && <figcaption className="mt-2 text-center text-sm text-white">{cur.caption}</figcaption>}
          </figure>
        </div>
      )}
    </>
  );
}
