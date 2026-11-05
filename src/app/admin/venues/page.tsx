import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { assignOwner, deleteVenue, setVenueStatus, toggleFeatured } from "@/app/actions/admin";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";
const PER_PAGE = 30;

export default async function AdminVenues({ searchParams }: { searchParams: { q?: string; status?: string; gov?: string; page?: string } }) {
  const { t, locale } = getT();
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = searchParams.q?.trim();
  const where: Prisma.VenueWhereInput = {
    ...(q ? { OR: [{ name: { contains: q } }, { city: { contains: q } }, { owner: { email: { contains: q } } }] } : {}),
    ...(searchParams.status ? { status: searchParams.status } : {}),
    ...(searchParams.gov ? { governorate: { slug: searchParams.gov } } : {}),
  };
  const [venues, total, govs] = await Promise.all([
    prisma.venue.findMany({ where, include: { owner: { select: { email: true, status: true } }, governorate: true }, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    prisma.venue.count({ where }),
    prisma.governorate.findMany({ orderBy: { nameFr: "asc" } }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const qs = (p: number) => new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([, v]) => v)), page: String(p) }).toString();

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder={t("admin.search")} className="input max-w-xs" />
        <select name="status" defaultValue={searchParams.status ?? ""} className="input w-auto">
          <option value="">{t("common.status")}</option>
          {["ACTIVE", "BLOCKED", "PENDING"].map((s) => <option key={s} value={s}>{t(`status.${s}` as DictKey)}</option>)}
        </select>
        <select name="gov" defaultValue={searchParams.gov ?? ""} className="input w-auto">
          <option value="">{t("common.governorate")}</option>
          {govs.map((g) => <option key={g.id} value={g.slug}>{locale === "en" ? g.nameEn : g.nameFr}</option>)}
        </select>
        <button className="btn-secondary">{t("common.search")}</button>
      </form>
      <p className="text-sm text-stone-500">{t("explore.results", { n: total })}</p>
      <div className="card overflow-x-auto">
        <table className="table-bp min-w-[900px]">
          <thead><tr><th>{t("common.name")}</th><th>{t("common.governorate")}</th><th>{t("admin.owner")}</th><th>{t("common.status")}</th><th>{t("common.actions")}</th></tr></thead>
          <tbody>
            {venues.map((v) => (
              <tr key={v.id}>
                <td>
                  <Link href={`/venues/${v.id}`} className="font-semibold hover:underline">{v.type === "CAFE" ? "☕" : "🍽️"} {v.name}</Link>
                  <div className="text-xs text-stone-400">{v.source}{v.featured ? " · ⭐" : ""}</div>
                </td>
                <td className="text-xs">{v.city ? `${v.city}, ` : ""}{locale === "en" ? v.governorate.nameEn : v.governorate.nameFr}</td>
                <td>
                  <form action={assignOwner} className="flex gap-1">
                    <input type="hidden" name="id" value={v.id} />
                    <input name="email" defaultValue={v.owner?.email ?? ""} placeholder={t("admin.assignOwner")} className="input w-44 py-1 text-xs" />
                    <button className="btn-secondary btn-sm">✔</button>
                  </form>
                  {v.owner?.status === "BLOCKED" && <span className="text-xs text-red-600">{t("common.blocked")}</span>}
                </td>
                <td>
                  <span className={`badge ${v.status === "ACTIVE" ? "bg-lime-100 text-lime-800" : "bg-red-100 text-red-700"}`}>{t(`status.${v.status}` as DictKey)}</span>
                  {v.blockReason && <div className="text-xs text-stone-500">{v.blockReason}</div>}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    <form action={setVenueStatus} className="flex gap-1">
                      <input type="hidden" name="id" value={v.id} />
                      {v.status === "BLOCKED" ? (
                        <><input type="hidden" name="status" value="ACTIVE" /><button className="btn-success btn-sm">{t("common.unblock")}</button></>
                      ) : (
                        <><input type="hidden" name="status" value="BLOCKED" /><input name="reason" placeholder={t("common.reason")} className="input w-28 py-1 text-xs" /><button className="btn-danger btn-sm">{t("common.block")}</button></>
                      )}
                    </form>
                    <form action={toggleFeatured}><input type="hidden" name="id" value={v.id} /><button className="btn-secondary btn-sm">{v.featured ? t("admin.unfeature") : t("admin.feature")}</button></form>
                    <form action={deleteVenue}><input type="hidden" name="id" value={v.id} /><button className="btn-secondary btn-sm text-red-600">🗑</button></form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex justify-center gap-3 text-sm">
          {page > 1 && <Link className="btn-secondary" href={`/admin/venues?${qs(page - 1)}`}>←</Link>}
          <span className="self-center">{page} / {pages}</span>
          {page < pages && <Link className="btn-secondary" href={`/admin/venues?${qs(page + 1)}`}>→</Link>}
        </div>
      )}
    </div>
  );
}
