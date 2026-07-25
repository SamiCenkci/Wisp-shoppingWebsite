"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TAXONOMY, getSubs, getProducts, getAttributes } from "@/lib/categories";
import AddressAutocomplete, { SelectedAddress } from "@/components/AddressAutocomplete";
import { useLanguage } from "@/lib/i18n";

export default function EditListingPage() {
  const { t, tc } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    sub_category: "",
    product_category: "",
    condition: "good",
    ad_type: "sale",
    street_address: "",
    postal_code: "",
    city: "",
    county: "",
  });
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const subs = getSubs(form.category);
  const products = getProducts(form.category, form.sub_category);
  const attrFields = getAttributes(form.category, form.sub_category, form.product_category);

  useEffect(() => {
    api(`/api/listings/${params.id}`)
      .then((data) => {
        const l = data.listing;
        setForm({
          title: l.title ?? "",
          description: l.description ?? "",
          price: String((l.price_ore ?? 0) / 100),
          category: l.category ?? "",
          sub_category: l.sub_category ?? "",
          product_category: l.product_category ?? "",
          condition: l.condition ?? "good",
          ad_type: l.ad_type ?? "sale",
          street_address: l.street_address ?? "",
          postal_code: l.postal_code ?? "",
          city: l.municipality ?? "",
          county: l.county ?? "",
        });
        if (l.attributes && typeof l.attributes === "object") {
          setAttributes(l.attributes as Record<string, string>);
        }
        if (l.latitude && l.longitude) {
          setCoords({ lat: l.latitude, lon: l.longitude });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function pickMain(value: string) {
    setForm((prev) => ({ ...prev, category: value, sub_category: "", product_category: "" }));
    setAttributes({});
  }
  function pickSub(value: string) {
    setForm((prev) => ({ ...prev, sub_category: value, product_category: "" }));
    setAttributes({});
  }
  function pickProduct(value: string) {
    setForm((prev) => ({ ...prev, product_category: value }));
    setAttributes({});
  }

  function onAddressSelect(addr: SelectedAddress) {
    setForm((prev) => ({
      ...prev,
      street_address: addr.street,
      postal_code: addr.postalCode,
      city: addr.city,
      county: addr.county,
    }));
    setCoords({ lat: addr.latitude, lon: addr.longitude });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api(`/api/listings/${params.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          price_ore: form.ad_type === "giveaway" ? 0 : Math.round(parseFloat(form.price || "0") * 100),
          category: form.category,
          sub_category: form.sub_category,
          product_category: form.product_category,
          attributes,
          condition: form.condition,
          county: form.county || "Norge",
          municipality: form.city || form.postal_code,
          street_address: form.street_address,
          postal_code: form.postal_code,
          latitude: coords?.lat ?? 0,
          longitude: coords?.lon ?? 0,
        }),
      });
      router.push("/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forms.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-line rounded-xl px-3.5 py-2.5 outline-none focus:border-brand bg-surface";
  const labelClass = "block text-sm font-medium text-ink mb-1.5";

  if (loading) return <p className="max-w-2xl mx-auto px-[5%] py-10 text-ink-secondary">{t("common.loading")}</p>;

  return (
    <main className="max-w-2xl mx-auto px-[5%] py-8">
      <button onClick={() => router.push("/my-listings")} className="text-brand text-sm mb-4 hover:underline">
        ← {t("forms.backToMyListings")}
      </button>
      <h1 className="text-2xl font-semibold mb-6 text-ink">{t("forms.editListingTitle")}</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-4">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div>
          <label className={labelClass}>{t("forms.adType")}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update("ad_type", "sale")}
              className={`flex-1 py-2.5 rounded-xl border font-medium text-sm ${
                form.ad_type === "sale"
                  ? "border-brand bg-brand-lightest text-brand"
                  : "border-line text-ink-secondary hover:border-brand"
              }`}
            >
              {t("forms.forSale")}
            </button>
            <button
              type="button"
              onClick={() => update("ad_type", "giveaway")}
              className={`flex-1 py-2.5 rounded-xl border font-medium text-sm ${
                form.ad_type === "giveaway"
                  ? "border-brand bg-brand-lightest text-brand"
                  : "border-line text-ink-secondary hover:border-brand"
              }`}
            >
              {t("forms.giveaway")}
            </button>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t("forms.title")}</label>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} required className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>{t("forms.description")}</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            rows={5}
            className={inputClass}
          />
        </div>

        {/* Category hierarchy */}
        <div className="space-y-3 border border-line rounded-xl p-4">
          <div>
            <label className={labelClass}>{t("forms.mainCategory")}</label>
            <select value={form.category} onChange={(e) => pickMain(e.target.value)} required className={inputClass}>
              <option value="">{t("forms.select")}</option>
              {TAXONOMY.map((m) => (
                <option key={m.name} value={m.name}>{tc(m.name)}</option>
              ))}
              {form.category && !TAXONOMY.some((m) => m.name === form.category) && (
                <option value={form.category}>{t("forms.oldCategory", { name: tc(form.category) })}</option>
              )}
            </select>
          </div>

          {subs.length > 0 && (
            <div>
              <label className={labelClass}>{t("forms.subCategory")}</label>
              <select value={form.sub_category} onChange={(e) => pickSub(e.target.value)} className={inputClass}>
                <option value="">{t("forms.select")}</option>
                {subs.map((s) => (
                  <option key={s.name} value={s.name}>{tc(s.name)}</option>
                ))}
              </select>
            </div>
          )}

          {products.length > 0 && (
            <div>
              <label className={labelClass}>{t("forms.productCategory")}</label>
              <select value={form.product_category} onChange={(e) => pickProduct(e.target.value)} className={inputClass}>
                <option value="">{t("forms.select")}</option>
                {products.map((p) => (
                  <option key={p.name} value={p.name}>{tc(p.name)}</option>
                ))}
              </select>
            </div>
          )}

          {attrFields.map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{tc(field.label)}</label>
              <select
                value={attributes[field.key] ?? ""}
                onChange={(e) => setAttributes((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className={inputClass}
              >
                <option value="">{t("forms.select")}</option>
                {field.options.map((o) => (
                  <option key={o} value={o}>{tc(o)}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div>
          <label className={labelClass}>{t("forms.address")}</label>
          <AddressAutocomplete
            value={form.street_address}
            onChange={(v) => update("street_address", v)}
            onSelect={onAddressSelect}
            placeholder={t("forms.addressPlaceholder")}
            className={inputClass}
          />
          {form.postal_code ? (
            <p className="text-xs text-brand mt-1.5">
              ✓ {form.postal_code} {form.city}
              {form.county ? ` · ${form.county}` : ""}
            </p>
          ) : (
            <p className="text-xs text-ink-muted mt-1.5">
              {t("forms.addressHint")}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {form.ad_type === "sale" && (
            <div>
              <label className={labelClass}>{t("forms.price")}</label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  required
                  className={`${inputClass} pr-10`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary text-sm pointer-events-none">
                  kr
                </span>
              </div>
            </div>
          )}
          <div>
            <label className={labelClass}>{t("forms.condition")}</label>
            <select value={form.condition} onChange={(e) => update("condition", e.target.value)} className={inputClass}>
              <option value="new">{tc("Ny")}</option>
              <option value="like_new">{tc("Som ny")}</option>
              <option value="good">{tc("God")}</option>
              <option value="fair">{tc("Brukbar")}</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand text-white rounded-xl py-3 font-medium hover:bg-brand-dark disabled:opacity-50 shadow-sm"
        >
          {saving ? t("common.saving") : t("forms.saveChanges")}
        </button>
      </form>
    </main>
  );
}
