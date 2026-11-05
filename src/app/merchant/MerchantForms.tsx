"use client";
import { useFormState } from "react-dom";
import { useTransition } from "react";
import { addMenuItem, addOffer, addPhoto, deleteMenuItem, deletePhoto, requestSubscription, saveVenue, toggleOffer, validateVoucher } from "@/app/actions/merchant";
import { SubmitButton } from "@/components/SubmitButton";
import { VenueMapLazy } from "@/components/VenueMapLazy";
import { useT } from "@/lib/i18n/client";
import type { DictKey } from "@/lib/i18n/dictionaries";

function Msg({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (state?.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state?.ok) return <p className="text-sm font-semibold text-olive-600">{state.ok}</p>;
  return null;
}

export type VenueFormValues = {
  id?: string; name?: string; type?: string; description?: string | null; cuisine?: string | null; address?: string | null;
  city?: string | null; phone?: string | null; website?: string | null; openingHours?: string | null; coverImage?: string | null;
  priceLevel?: number; lat?: number; lng?: number; governorateId?: string; features?: string[];
};

export function VenueForm({ v, governorates, features }: { v: VenueFormValues; governorates: { id: string; name: string }[]; features: readonly string[] }) {
  const { t } = useT();
  const [state, action] = useFormState(saveVenue, undefined);
  const field = (name: keyof VenueFormValues, label: DictKey, type = "text") => (
    <div>
      <label className="label" htmlFor={name}>{t(label)}</label>
      <input id={name} name={name} type={type} defaultValue={(v[name] as string | undefined) ?? ""} className="input" />
    </div>
  );
  return (
    <form action={action} className="space-y-4">
      {v.id && <input type="hidden" name="id" value={v.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">{t("common.name")}</label>
          <input id="name" name="name" required defaultValue={v.name ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="type">{t("common.type")}</label>
          <select id="type" name="type" defaultValue={v.type ?? "CAFE"} className="input">
            <option value="CAFE">{t("common.cafe")}</option>
            <option value="RESTAURANT">{t("common.restaurant")}</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="governorateId">{t("common.governorate")}</label>
          <select id="governorateId" name="governorateId" defaultValue={v.governorateId ?? ""} className="input">
            <option value="">— auto —</option>
            {governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        {field("city", "merchant.city")}
        {field("address", "merchant.address")}
        {field("phone", "common.phone", "tel")}
        {field("cuisine", "merchant.cuisine")}
        {field("openingHours", "merchant.hours")}
        {field("website", "merchant.website", "url")}
        {field("coverImage", "merchant.cover", "url")}
        <div>
          <label className="label" htmlFor="priceLevel">{t("merchant.priceLevel")}</label>
          <input id="priceLevel" name="priceLevel" type="number" min={1} max={4} defaultValue={v.priceLevel ?? 2} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">{t("merchant.description")}</label>
        <textarea id="description" name="description" rows={3} defaultValue={v.description ?? ""} className="input" />
      </div>
      <fieldset>
        <legend className="label">{t("merchant.features")}</legend>
        <div className="flex flex-wrap gap-3">
          {features.map((f) => (
            <label key={f} className="flex items-center gap-1 text-sm">
              <input type="checkbox" name={`feature_${f}`} defaultChecked={v.features?.includes(f)} /> {t(`feature.${f}` as DictKey)}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <span className="label">{t("merchant.latlng")}</span>
        <VenueMapLazy points={[]} center={v.lat && v.lng ? [v.lat, v.lng] : [36.8065, 10.1815]} zoom={v.lat ? 15 : 7} height="20rem" picker={{ name: "pos", initial: v.lat && v.lng ? [v.lat, v.lng] : null }} />
      </div>
      <Msg state={state} />
      <SubmitButton>{t("common.save")}</SubmitButton>
    </form>
  );
}

export function PhotoForm({ venueId }: { venueId: string }) {
  const { t } = useT();
  const [state, action] = useFormState(addPhoto, undefined);
  return (
    <form action={action} className="grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-2">
      <input type="hidden" name="venueId" value={venueId} />
      <div>
        <label className="label">{t("merchant.photoKind")}</label>
        <select name="kind" className="input">
          <option value="MENU">{t("venue.menuPhotos")}</option>
          <option value="PLACE">{t("venue.placePhotos")}</option>
        </select>
      </div>
      <div>
        <label className="label">{t("merchant.caption")}</label>
        <input name="caption" className="input" />
      </div>
      <div>
        <label className="label">{t("merchant.file")}</label>
        <input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
      </div>
      <div>
        <label className="label">{t("merchant.photoUrl")}</label>
        <input name="url" type="url" placeholder="https://…" className="input" />
      </div>
      <div className="sm:col-span-2 flex items-center gap-3"><SubmitButton>{t("merchant.uploadPhoto")}</SubmitButton><Msg state={state} /></div>
    </form>
  );
}

export function MenuItemForm({ venueId }: { venueId: string }) {
  const { t } = useT();
  const [state, action] = useFormState(addMenuItem, undefined);
  return (
    <form action={action} className="grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-4">
      <input type="hidden" name="venueId" value={venueId} />
      <input name="category" required placeholder={t("merchant.category")} className="input" list="menu-categories" />
      <datalist id="menu-categories">
        {["Boissons chaudes", "Boissons fraîches", "Petit-déjeuner", "Entrées", "Plats", "Pizzas", "Sandwichs", "Desserts", "Chichas"].map((c) => <option key={c} value={c} />)}
      </datalist>
      <input name="name" required placeholder={t("common.name")} className="input" />
      <input name="price" required type="number" step="0.001" min="0" placeholder={t("merchant.price")} className="input" />
      <input name="description" placeholder={t("merchant.description")} className="input" />
      <div className="sm:col-span-4 flex items-center gap-3"><SubmitButton>{t("common.add")}</SubmitButton><Msg state={state} /></div>
    </form>
  );
}

export function OfferForm({ venueId }: { venueId: string }) {
  const { t } = useT();
  const [state, action] = useFormState(addOffer, undefined);
  return (
    <form action={action} className="grid gap-3 rounded-xl bg-stone-50 p-4 sm:grid-cols-3">
      <input type="hidden" name="venueId" value={venueId} />
      <input name="title" required placeholder={t("merchant.offerTitle")} className="input sm:col-span-2" />
      <input name="pointsCost" required type="number" min={1} placeholder={t("merchant.pointsCost")} className="input" />
      <input name="description" placeholder={t("merchant.description")} className="input sm:col-span-3" />
      <input name="valueTnd" type="number" step="0.5" min={0} placeholder={t("merchant.valueTnd")} className="input" />
      <input name="stock" required type="number" min={0} defaultValue={50} placeholder={t("merchant.stock")} className="input" />
      <input name="expiresAt" type="date" aria-label={t("merchant.expiresAt")} className="input" />
      <div className="sm:col-span-3 flex items-center gap-3"><SubmitButton>{t("common.add")}</SubmitButton><Msg state={state} /></div>
    </form>
  );
}

export function ValidateVoucherForm() {
  const { t } = useT();
  const [state, action] = useFormState(validateVoucher, undefined);
  return (
    <form action={action} className="space-y-2">
      <div className="flex gap-2">
        <input name="code" required placeholder="BP-XXXX-XXXX" className="input font-mono uppercase" aria-label={t("merchant.validateCode")} />
        <SubmitButton>{t("merchant.validateBtn")}</SubmitButton>
      </div>
      <Msg state={state} />
    </form>
  );
}

export function ActionButton({ kind, id, label, className = "text-xs text-red-600 underline" }: { kind: "photo" | "item" | "offer"; id: string; label: string; className?: string }) {
  const [pending, start] = useTransition();
  const fn = kind === "photo" ? deletePhoto : kind === "item" ? deleteMenuItem : toggleOffer;
  return <button type="button" disabled={pending} className={className} onClick={() => start(() => fn(id))}>{label}</button>;
}

export function RequestSubscription({ prices }: { prices: { MONTHLY: number; YEARLY: number } }) {
  const { t } = useT();
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap gap-2">
      {(["MONTHLY", "YEARLY"] as const).map((p) => (
        <button key={p} className="btn-primary btn-sm" disabled={pending} onClick={() => start(() => requestSubscription(p))}>
          {t("merchant.subRequest")} — {t(`merchant.plan.${p}` as DictKey)} ({prices[p]} {t("common.tnd")})
        </button>
      ))}
    </div>
  );
}
