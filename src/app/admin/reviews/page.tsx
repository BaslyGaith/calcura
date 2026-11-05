import Link from "next/link";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { toggleReview } from "@/app/actions/admin";
import { Stars } from "@/components/Stars";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  const { t, locale } = getT();
  const reviews = await prisma.review.findMany({ include: { user: { select: { name: true, email: true } }, venue: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="card overflow-x-auto">
      <table className="table-bp min-w-[700px]">
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} className={r.hidden ? "opacity-50" : ""}>
              <td className="text-xs text-stone-500">{r.createdAt.toLocaleDateString(locale)}</td>
              <td><Link href={`/venues/${r.venue.id}`} className="font-semibold hover:underline">{r.venue.name}</Link><div className="text-xs text-stone-500">{r.user.name} · {r.user.email}</div></td>
              <td><Stars value={r.rating} /><div className="max-w-md text-sm">{r.comment}</div></td>
              <td><form action={toggleReview}><input type="hidden" name="id" value={r.id} /><button className="btn-secondary btn-sm">{r.hidden ? t("admin.show") : t("admin.hide")}</button></form></td>
            </tr>
          ))}
        </tbody>
      </table>
      {reviews.length === 0 && <p className="p-6 text-stone-500">{t("common.none")}</p>}
    </div>
  );
}
