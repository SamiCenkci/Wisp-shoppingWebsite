"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { TAXONOMY, getSubs, getProducts, getAttributes } from "@/lib/categories";
import AddressAutocomplete, { SelectedAddress } from "@/components/AddressAutocomplete";
import { compressImage } from "@/lib/compressImage";
import { useLanguage } from "@/lib/i18n";

export default function NewListingPage() {
  const { t, tc } = useLanguage();
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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const subs = getSubs(form.category);
  const products = getProducts(form.category, form.sub_category);
  const attrFields = getAttributes(form.category, form.sub_category, form.product_category);
  const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Changing a level clears everything below it
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

  function onFilesChange(selected: File[]) {
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }

  async function uploadFile(original: File): Promise<string> {
    const file = await compressImage(original);

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(t("forms.fileTooLarge", { name: original.name }));
    }
    const { upload_url, public_url } = await api("/api/uploads/presign", {
      method: "POST",
      body: JSON.stringify({ file_name: file.name, content_type: file.type }),
    });
    const res = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!res.ok) throw new Error(t("forms.imageUploadFailed"));
    return public_url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.category) {
      setError(t("forms.chooseMainCategoryError"));
      return;
    }
    if (!form.postal_code) {
      setError(t("forms.addressRequiredError"));
      return;
    }
    setLoading(true);
    try {
      const imageUrls: string[] = [];
      for (const file of files) imageUrls.push(await uploadFile(file));
      await api("/api/listings", {
        method: "POST",
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
          ad_type: form.ad_type,
          street_address: form.street_address,
          postal_code: form.postal_code,
          latitude: coords?.lat ?? 0,
          longitude: coords?.lon ?? 0,
          images: imageUrls,
        }),
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forms.createFailed"));
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border border-line rounded-xl px-3.5 py-2.5 outline-none focus:border-brand bg-surface";
  const labelClass = "block text-sm font-medium text-ink mb-1.5";

  return (
    <main className="max-w-[1100px] mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-semibold mb-6 text-ink">{t("forms.newListingTitle")}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
            <label className={labelClass}>{t("forms.images")}</label>
            <label className="block border-2 border-dashed border-line rounded-xl p-6 text-center cursor-pointer hover:border-brand transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => onFilesChange(Array.from(e.target.files ?? []))}
                className="hidden"
              />
              <span className="text-3xl block mb-2">📷</span>
              <span className="text-sm text-ink-secondary">{t("forms.clickToUpload")}</span>
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mt-3">
                {previews.map((src, i) => (
                  <img key={i} src={src} alt={t("forms.previewAlt", { n: i + 1 })} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            )}
            {files.length > 0 && <p className="text-xs text-ink-muted mt-2">{t("forms.imagesSelected", { n: files.length })}</p>}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-4">
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
              <input value={form.title} onChange={(e) => update("title", e.target.value)} required className={inputClass} placeholder={t("forms.titlePlaceholder")} />
            </div>

            <div>
              <label className={labelClass}>{t("forms.description")}</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} required rows={5} className={inputClass} placeholder={t("forms.descriptionPlaceholder")} />
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
                      placeholder="0"
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
              disabled={loading}
              className="w-full bg-brand text-white rounded-xl py-3 font-medium hover:bg-brand-dark disabled:opacity-50 shadow-sm"
            >
              {loading ? t("forms.publishing") : t("forms.publish")}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
