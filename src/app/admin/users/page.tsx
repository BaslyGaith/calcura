import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { adjustPoints, setUserRole, setUserStatus } from "@/app/actions/admin";
import type { DictKey } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string; role?: string } }) {
  const { t, locale } = getT();
  const me = await getCurrentUser();
  const q = searchParams.q?.trim();
  const users = await prisma.user.findMany({
    where: { ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}), ...(searchParams.role ? { role: searchParams.role } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder={t("admin.search")} className="input max-w-xs" />
        <select name="role" defaultValue={searchParams.role ?? ""} className="input w-auto">
          <option value="">{t("admin.role")}</option>
          {["USER", "MERCHANT", "ADMIN"].map((r) => <option key={r} value={r}>{t(`role.${r}` as DictKey)}</option>)}
        </select>
        <button className="btn-secondary">{t("common.search")}</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="table-bp min-w-[900px]">
          <thead><tr><th>{t("common.name")}</th><th>{t("admin.role")}</th><th>{t("common.points")}</th><th>{t("common.status")}</th><th>{t("admin.adjustPoints")}</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><div className="font-semibold">{u.name}</div><div className="text-xs text-stone-500">{u.email} · {u.createdAt.toLocaleDateString(locale)}</div></td>
                <td>
                  {u.id === me?.id ? t(`role.${u.role}` as DictKey) : (
                    <form action={setUserRole} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      <select name="role" defaultValue={u.role} className="input w-auto py-1 text-xs">
                        {["USER", "MERCHANT", "ADMIN"].map((r) => <option key={r} value={r}>{t(`role.${r}` as DictKey)}</option>)}
                      </select>
                      <button className="btn-secondary btn-sm">✔</button>
                    </form>
                  )}
                </td>
                <td className="font-bold">⭐ {u.points}</td>
                <td>
                  {u.id !== me?.id && (
                    <form action={setUserStatus} className="flex gap-1">
                      <input type="hidden" name="id" value={u.id} />
                      {u.status === "ACTIVE" ? (
                        <><input type="hidden" name="status" value="BLOCKED" /><input name="reason" placeholder={t("common.reason")} className="input w-28 py-1 text-xs" /><button className="btn-danger btn-sm">{t("common.block")}</button></>
                      ) : (
                        <><input type="hidden" name="status" value="ACTIVE" /><span className="badge bg-red-100 text-red-700">{t("common.blocked")}</span><button className="btn-success btn-sm">{t("common.unblock")}</button></>
                      )}
                    </form>
                  )}
                </td>
                <td>
                  <form action={adjustPoints} className="flex gap-1">
                    <input type="hidden" name="id" value={u.id} />
                    <input name="amount" type="number" placeholder="±" className="input w-20 py-1 text-xs" />
                    <input name="detail" placeholder={t("common.reason")} className="input w-28 py-1 text-xs" />
                    <button className="btn-secondary btn-sm">✔</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
