import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import { FEATURES } from "@/lib/venues";
import { VenueForm } from "../../MerchantForms";
import { redirect } from "next/navigation";

export default async function NewVenuePage() {
  const user = await requireUser(["MERCHANT"]);
  if (user.status === "BLOCKED") redirect("/merchant");
  const { t, locale } = getT();
  const govs = await prisma.governorate.findMany({ orderBy: { nameFr: "asc" } });
  return (
    <div className="container-bp max-w-3xl py-8">
      <h1 className="h1 mb-6">{t("merchant.newVenue")}</h1>
      <div className="card p-6">
        <VenueForm v={{}} features={FEATURES} governorates={govs.map((g) => ({ id: g.id, name: locale === "en" ? g.nameEn : g.nameFr }))} />
      </div>
    </div>
  );
}
