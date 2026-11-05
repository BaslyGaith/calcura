import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { FEATURES, parseFeatures } from "@/lib/venues";
import { ActionButton, DishImageForm, MenuItemForm, OfferForm, PhotoForm, VenueForm } from "../../MerchantForms";

export const dynamic = "force-dynamic";

export default async function EditVenuePage({ params }: { params: { id: string } }) {
  const user = await requireUser(["MERCHANT"]);
  if (user.status === "BLOCKED") redirect("/merchant");
  const { t, locale } = getT();
  const venue = await prisma.venue.findFirst({
    where: { id: params.id, ownerId: user.id },
    include: { photos: { orderBy: { createdAt: "desc" } }, menuItems: { orderBy: [{ category: "asc" }, { name: "asc" }] }, offers: { orderBy: { createdAt: "desc" }, include: { _count: { select: { vouchers: true } } } } },
  });
  if (!venue) notFound();
  const govs = await prisma.governorate.findMany({ orderBy: { nameFr: "asc" } });

  return (
    <div className="container-bp max-w-4xl space-y-6 py-8">
      <div className="flex items-center justify-between gap-2">
        <h1 className="h1">{venue.name}</h1>
        <div className="flex gap-2">
          <Link href={`/venues/${venue.id}`} className="btn-secondary btn-sm">👁</Link>
          <Link href="/merchant" className="btn-secondary btn-sm">← {t("common.back")}</Link>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="h2 mb-4">{t("merchant.info")}</h2>
        <VenueForm
          features={FEATURES}
          governorates={govs.map((g) => ({ id: g.id, name: locale === "en" ? g.nameEn : g.nameFr }))}
          v={{ ...venue, features: parseFeatures(venue.features) }}
        />
      </section>

      <section className="card p-6">
        <h2 className="h2 mb-4">📷 {t("merchant.photos")}</h2>
        <PhotoForm venueId={venue.id} />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {venue.photos.map((p) => (
            <div key={p.id} className="overflow-hidden rounded-xl border border-stone-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.caption ?? ""} className="aspect-square w-full object-cover" />
              <div className="flex items-center justify-between p-2 text-xs">
                <span className="badge bg-stone-100">{p.kind === "MENU" ? t("venue.menu") : "📸"}</span>
                <ActionButton kind="photo" id={p.id} label={t("common.delete")} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="h2 mb-4">🍴 {t("merchant.menuItems")}</h2>
        <MenuItemForm venueId={venue.id} />
        <table className="table-bp mt-4">
          <tbody>
            {venue.menuItems.map((m) => (
              <tr key={m.id}>
                <td className="w-14">
                  {m.imageUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={m.imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    : <span className="grid h-12 w-12 place-items-center rounded-lg bg-stone-100 text-xs text-stone-400">—</span>}
                </td>
                <td className="text-xs text-stone-500">{m.category}</td>
                <td className="font-medium">{m.name}<div className="mt-1"><DishImageForm itemId={m.id} hasImage={!!m.imageUrl} /></div></td>
                <td className="text-right">{m.price.toFixed(3)} {t("common.tnd")}</td>
                <td className="text-right"><ActionButton kind="item" id={m.id} label={t("common.delete")} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card p-6">
        <h2 className="h2 mb-4">🎁 {t("merchant.offers")}</h2>
        <OfferForm venueId={venue.id} />
        <table className="table-bp mt-4">
          <tbody>
            {venue.offers.map((o) => (
              <tr key={o.id} className={o.active ? "" : "opacity-50"}>
                <td className="font-medium">{o.title}</td>
                <td>⭐ {o.pointsCost}</td>
                <td className="text-xs">{t("rewards.left", { n: o.stock })} · 🎟 {o._count.vouchers}</td>
                <td className="text-right"><ActionButton kind="offer" id={o.id} label={o.active ? t("common.block") : t("common.unblock")} className="text-xs underline" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
