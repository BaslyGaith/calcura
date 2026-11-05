"use client";
import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/actions/auth";

export function MobileNav({ links, logoutLabel }: { links: { href: string; label: string }[]; logoutLabel: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden">
      <button type="button" className="btn-secondary btn-sm" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((o) => !o)}>
        ☰
      </button>
      {open && (
        <div className="absolute inset-x-0 top-14 border-b border-stone-200 bg-white shadow-lg">
          <nav className="container-bp flex flex-col py-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 font-medium hover:bg-orange-50">
                {l.label}
              </Link>
            ))}
            {logoutLabel && (
              <form action={logout}>
                <button className="w-full rounded-lg px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50">{logoutLabel}</button>
              </form>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
