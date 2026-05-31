"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function EditProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    bio: "",
    phone: "",
    birth_year: "",
    gender: "",
    street_address: "",
    postal_code: "",
    city: "",
    country: "Norge",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        const me = JSON.parse(stored);
        setForm((prev) => ({ ...prev, name: me.name ?? "", display_name: me.display_name ?? "" }));
        setAvatarUrl(me.avatar_url ?? "");
      } catch {}
    }
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function uploadAvatar(file: File) {
    setUploading(true);
    try {
      const { upload_url, public_url } = await api("/api/uploads/presign", {
        method: "POST",
        body: JSON.stringify({ file_name: file.name, content_type: file.type }),
      });
      const res = await fetch(upload_url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!res.ok) throw new Error("Opplasting feilet");
      setAvatarUrl(public_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Opplasting feilet");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const updated = await api("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ ...form, avatar_url: avatarUrl }),
      });
      const stored = localStorage.getItem("user");
      const me = stored ? JSON.parse(stored) : {};
      localStorage.setItem("user", JSON.stringify({ ...me, name: updated.name, avatar_url: updated.avatar_url, display_name: updated.display_name }));
      router.push(`/profile/${updated.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lagring feilet");
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-brand";
  const labelClass = "block text-sm font-medium text-ink mb-1";

  return (
    <main className="max-w-2xl mx-auto px-[5%] py-10">
      <h1 className="text-2xl font-semibold mb-6 text-ink">Rediger profil</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <section className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-ink mb-4">Fortell om deg selv</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-brand-lightest overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand text-2xl font-bold">{form.name.charAt(0).toUpperCase() || "?"}</span>
              )}
            </div>
            <div>
              <label className={labelClass}>Profilbilde</label>
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
                className="text-sm text-ink-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-lightest file:text-brand file:font-medium" />
              {uploading && <p className="text-xs text-ink-muted mt-1">Laster opp...</p>}
            </div>
          </div>
          <label className={labelClass}>Beskrivelse</label>
          <textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={3} maxLength={500} className={inputClass}
            placeholder="Beskrivelsen kan ikke inneholde telefonnumre, e-postadresser eller lenker. Maksimum 500 tegn." />
          <p className="text-xs text-ink-muted mt-1">{form.bio.length}/500 tegn</p>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-ink mb-4">Om deg</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Navn</label>
              <input value={form.name} onChange={(e) => update("name", e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Visningsnavn</label>
              <input value={form.display_name} onChange={(e) => update("display_name", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Født (årstall)</label>
              <input value={form.birth_year} onChange={(e) => update("birth_year", e.target.value)} className={inputClass} placeholder="2002" />
            </div>
            <div>
              <label className={labelClass}>Kjønn</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)} className={inputClass}>
                <option value="">Velg...</option>
                <option value="Mann">Mann</option>
                <option value="Kvinne">Kvinne</option>
                <option value="Annet">Annet</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Mobilnummer</label>
              <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="+47..." />
            </div>
          </div>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-ink mb-4">Adresse</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Gateadresse</label>
              <input value={form.street_address} onChange={(e) => update("street_address", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Postnummer</label>
              <input value={form.postal_code} onChange={(e) => update("postal_code", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Poststed</label>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Land</label>
              <input value={form.country} onChange={(e) => update("country", e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        <button type="submit" disabled={saving || uploading}
          className="w-full bg-brand text-white rounded-lg py-2.5 font-medium hover:bg-brand-dark disabled:opacity-50">
          {saving ? "Lagrer..." : "Lagre endringer"}
        </button>
      </form>
    </main>
  );
}