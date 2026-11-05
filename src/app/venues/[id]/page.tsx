import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import { parseFeatures, visibleVenueWhere } from "@/lib/venues";
import { Stars } from "@/components/Stars";
import { VenueMapLazy } from "@/components/VenueMapLazy";
import { RedeemButton } from "@/components/RedeemButton";
import { PhotoGallery } from "./PhotoGallery";
import { VenueActions } from "./VenueActions";
import { ReviewForm } from "./ReviewForm";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const v = await prisma.venue.findUnique({ where: { id: params.id }, select: { name: true, city: true } });
  return { title: v ? `${v.name}${v.city ? ` — ${v.city}` : ""}` : "Bon Plan" };
}

export default async function VenuePage({ params }: { params: { id: string } }) {
  const { t, locale } = getT();
  const user = await getCurrentUser();
  const venue = await prisma.venue.findUnique({
    where: { id: params.id },
    include: {
      governorate: true,
      photos: { orderBy: { createdAt: "asc" } },
      menuItems: { where: { available: true }, orderBy: [{ category: "asc" }, { name: "asc" }] },
      offers: { where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, orderBy: { pointsCost: "asc" } },
      reviews: { where: { hidden: false }, include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
  if (!venue) notFound();

  const canSeeHidden = user && (user.role === "ADMIN" || user.id === venue.ownerId);
  const visible = await prisma.venue.count({ where: { AND: [{ id: venue.id }, visibleVenueWhere] } });
  if (!visible && !canSeeHidden) {
    return <div className="container-bp py-16 text-center"><p className="card inline-block p-8 text-stone-600">{t("venue.blocked")}</p></div>;
  }

  const [fav, myReview, settings] = await Promise.all([
    user ? prisma.favorite.findUnique({ where: { userId_venueId: { userId: user.id, venueId: venue.id } } }) : null,
    user ? prisma.review.findUnique({ where: { userId_venueId: { userId: user.id, venueId: venue.id } } }) : null,
    getSettings(),
  ]);
  const avg = venue.reviews.length ? venue.reviews.reduce((a, r) => a + r.rating, 0) / venue.reviews.length : null;
  const menuPhotos = venue.photos.filter((p) => p.kind === "MENU");
  const placePhotos = venue.photos.filter((p) => p.kind === "PLACE");
  const cover = venue.coverImage ?? placePhotos[0]?.url;
  const categories = Array.from(new Set(venue.menuItems.map((m) => m.category)));
  const features = parseFeatures(venue.features);
  const gov = locale === "en" ? venue.governorate.nameEn : venue.governorate.nameFr;

  return (
    <div className="pb-10">
      <div className="relative h-56 bg-gradient-to-br from-orange-200 to-amber-100 sm:h-72">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {cover && <img src={cover} alt={venue.name} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="container-bp absolute inset-x-0 bottom-0 pb-4 text-white">
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-white/90 text-stone-800">{venue.type === "CAFE" ? "☕ " + t("common.cafe") : "🍽️ " + t("common.restaurant")}</span>
            {venue.status !== "ACTIVE" && <span className="badge bg-red-600 text-white">{t(`status.${venue.status}` as DictKey)}</span>}
            {venue.source === "DEMO" && <span className="badge bg-stone-700 text-white">{t("common.demo")}</span>}
          </div>
          <h1 className="mt-2 text-3xl font-extrabold">{venue.name}</h1>
          <p className="text-sm text-white/90">
            {[venue.address, venue.city, gov].filter(Boolean).join(", ")}
            {avg !== null && <> · <Stars value={avg} /> {avg.toFixed(1)} ({venue.reviews.length})</>}
          </p>
        </div>
      </div>

      <div className="container-bp mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <VenueActions venueId={venue.id} isFavorite={!!fav} loggedIn={!!user} phone={venue.phone} lat={venue.lat} lng={venue.lng} />

          {(venue.description || features.length > 0) && (
            <section className="card p-5">
              {venue.description && <p className="text-stone-700">{venue.description}</p>}
              {features.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {features.map((f) => <span key={f} className="badge bg-orange-100 text-brand-700">{t(`feature.${f}` as DictKey)}</span>)}
                </div>
              )}
            </section>
          )}

          <section className="card p-5">
            <h2 className="h2 mb-3">📜 {t("venue.menuPhotos")}</h2>
            <PhotoGallery photos={menuPhotos} empty={t("venue.noPhotos")} />
          </section>

          <section className="card p-5">
            <h2 className="h2 mb-3">🍴 {t("venue.menu")}</h2>
            {categories.length === 0 ? (
              <p className="text-sm text-stone-500">{t("venue.noMenu")}</p>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {categories.map((c) => (
                  <div key={c}>
                    <h3 className="mb-2 border-b border-dashed border-stone-300 pb-1 font-bold text-brand-700">{c}</h3>
                    <ul className="space-y-2">
                      {venue.menuItems.filter((m) => m.category === c).map((m) => (
                        <li key={m.id} className="flex justify-between gap-3 text-sm">
                          <span>
                            <span className="font-medium">{m.name}</span>
                            {m.description && <span className="block text-xs text-stone-500">{m.description}</span>}
                          </span>
                          <span className="whitespace-nowrap font-semibold">{m.price.toFixed(3)} {t("common.tnd")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-5">
            <h2 className="h2 mb-3">📸 {t("venue.placePhotos")}</h2>
            <PhotoGallery photos={placePhotos} empty={t("venue.noPhotos")} />
          </section>

          <section className="card p-5">
            <h2 className="h2 mb-3">💬 {t("venue.reviews")}</h2>
            {user && user.id !== venue.ownerId ? (
              <div className="mb-5 rounded-xl bg-stone-50 p-4">
                <h3 className="mb-2 font-semibold">{t("venue.yourReview")}</h3>
                <ReviewForm venueId={venue.id} initial={myReview ?? undefined} points={settings.reviewPoints} />
              </div>
            ) : !user ? (
              <p className="mb-4 text-sm"><Link href="/login" className="font-semibold text-brand-600">{t("venue.loginToReview")}</Link></p>
            ) : null}
            {venue.reviews.length === 0 ? (
              <p className="text-sm text-stone-500">{t("venue.noReviews")}</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {venue.reviews.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{r.user.name}</span>
                      <span className="text-xs text-stone-400">{r.createdAt.toLocaleDateString(locale)}</span>
                    </div>
                    <Stars value={r.rating} />
                    {r.comment && <p className="mt-1 text-sm text-stone-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          {venue.offers.length > 0 && (
            <section className="card border-olive-500/40 bg-lime-50/60 p-5">
              <h2 className="h2 mb-3">🎁 {t("venue.offers")}</h2>
              <ul className="space-y-3">
                {venue.offers.map((o) => (
                  <li key={o.id} className="rounded-xl bg-white p-3">
                    <div className="font-semibold">{o.title}</div>
                    {o.description && <p className="text-xs text-stone-500">{o.description}</p>}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-stone-500">{t("rewards.left", { n: o.stock })}</span>
                      <RedeemButton offerId={o.id} cost={o.pointsCost} balance={user?.points ?? null} stock={o.stock} loggedIn={!!user} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className="card p-5">
            <h2 className="h2 mb-3">📍 {t("venue.location")}</h2>
            <VenueMapLazy points={[{ id: venue.id, name: venue.name, type: venue.type, lat: venue.lat, lng: venue.lng, city: venue.city }]} center={[venue.lat, venue.lng]} zoom={15} height="16rem" />
            <dl className="mt-3 space-y-1 text-sm">
              {venue.openingHours && <div><dt className="inline font-semibold">{t("venue.hours")} : </dt><dd className="inline">{venue.openingHours}</dd></div>}
              {venue.phone && <div><dt className="inline font-semibold">{t("common.phone")} : </dt><dd className="inline">{venue.phone}</dd></div>}
              {venue.website && <div><a href={venue.website} target="_blank" rel="noreferrer" className="text-brand-600 underline">{venue.website}</a></div>}
            </dl>
          </section>
          {venue.source === "OSM" && <p className="text-xs text-stone-400">{t("venue.source.OSM")}</p>}
          {!venue.ownerId && <p className="text-xs text-stone-500">{t("venue.claim")}</p>}
        </aside>
      </div>
    </div>
  );
}
