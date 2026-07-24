"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/compressImage";

const currentYear = new Date().getFullYear();
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// 8 digits -> "123 45 678"
function formatPhone(digits: string) {
  const d = digits.slice(0, 8);
  if (d.length <= 3) return d;
  if (d.length <= 5) return `${d.slice(0, 3)} ${d.slice(3)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 5)} ${d.slice(5)}`;
}

export default function EditProfilePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: "",
    display_name: "",
    bio: "",
    birth_year: "",
    gender: "",
    street_address: "",
    postal_code: "",
    city: "",
    country: "Norge",
  });
  const [phoneDigits, setPhoneDigits] = useState("");
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
        if (me.phone) {
          const d = String(me.phone).replace(/\D/g, "");
          setPhoneDigits(d.length > 8 && d.startsWith("47") ? d.slice(2, 10) : d.slice(0, 8));
        }
      } catch {}
    }
  }, []);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Names: no digits
  function updateName(field: string, value: string, maxLen: number) {
    update(field, value.replace(/[0-9]/g, "").slice(0, maxLen));
  }

  function updateDigits(field: string, value: string, maxLen: number) {
    update(field, value.replace(/\D/g, "").slice(0, maxLen));
  }

  function updatePhone(value: string) {
    let d = value.replace(/\D/g, "");
    if (d.length > 8 && d.startsWith("47")) d = d.slice(2);
    setPhoneDigits(d.slice(0, 8));
  }

  const birthYearInvalid =
    form.birth_year.length === 4 &&
    (Number(form.birth_year) < 1900 || Number(form.birth_year) > currentYear);
  const phoneInvalid = phoneDigits.length > 0 && phoneDigits.length < 8;

  async function uploadAvatar(original: File) {
    setError("");
    if (!original.type) {
      setError("Kunne ikke gjenkjenne filtypen. Prøv en JPG, PNG, GIF eller WEBP.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    // Avatars render at 112px, so anything larger than 512 is wasted bytes.
    const file = await compressImage(original, 512);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError("Bildet er for stort. Maks 10 MB.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

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
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (birthYearInvalid) {
      setError(`Fødselsår må være mellom 1900 og ${currentYear}.`);
      return;
    }
    if (phoneInvalid) {
      setError("Mobilnummer må ha 8 siffer.");
      return;
    }
    setSaving(true);
    try {
      const phone = phoneDigits.length === 8 ? `+47 ${formatPhone(phoneDigits)}` : "";
      const updated = await api("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ ...form, phone, avatar_url: avatarUrl }),
      });
      const stored = localStorage.getItem("user");
      const me = stored ? JSON.parse(stored) : {};
      localStorage.setItem(
        "user",
        JSON.stringify({ ...me, name: updated.name, avatar_url: updated.avatar_url, display_name: updated.display_name })
      );
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
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <section className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-ink mb-4">Fortell om deg selv</h2>

          <div className="flex flex-col items-center mb-6">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAvatar(f);
              }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="group relative w-28 h-28 rounded-full bg-brand-lightest overflow-hidden flex items-center justify-center border-2 border-line hover:border-brand transition-colors disabled:opacity-60"
              aria-label="Endre profilbilde"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profilbilde" className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand text-4xl font-bold">{form.name.charAt(0).toUpperCase() || "?"}</span>
              )}
              <span className="absolute inset-0 bg-black/50 text-white text-xs font-medium flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? "Laster opp..." : "Endre bilde"}
              </span>
            </button>
            <p className="text-xs text-ink-muted mt-2">Trykk på bildet for å endre</p>
          </div>

          <label className={labelClass}>Beskrivelse</label>
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value)}
            rows={3}
            maxLength={500}
            className={inputClass}
            placeholder="Beskrivelsen kan ikke inneholde telefonnumre, e-postadresser eller lenker. Maksimum 500 tegn."
          />
          <p className="text-xs text-ink-muted mt-1">{form.bio.length}/500 tegn</p>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-ink mb-4">Om deg</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Navn</label>
              <input
                value={form.name}
                onChange={(e) => updateName("name", e.target.value, 60)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Visningsnavn</label>
              <input
                value={form.display_name}
                onChange={(e) => updateName("display_name", e.target.value, 40)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Født (årstall)</label>
              <input
                inputMode="numeric"
                value={form.birth_year}
                onChange={(e) => updateDigits("birth_year", e.target.value, 4)}
                className={`${inputClass} ${birthYearInvalid ? "border-red-400" : ""}`}
                placeholder="2002"
              />
              {birthYearInvalid && (
                <p className="text-xs text-red-600 mt-1">Må være mellom 1900 og {currentYear}</p>
              )}
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
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-line bg-subtle text-ink-secondary text-sm shrink-0">
                  +47
                </span>
                <input
                  inputMode="numeric"
                  value={formatPhone(phoneDigits)}
                  onChange={(e) => updatePhone(e.target.value)}
                  className={`w-full border border-line rounded-r-lg px-3 py-2 outline-none focus:border-brand ${
                    phoneInvalid ? "border-red-400" : ""
                  }`}
                  placeholder="123 45 678"
                />
              </div>
              {phoneInvalid && <p className="text-xs text-red-600 mt-1">Må ha 8 siffer</p>}
            </div>
          </div>
        </section>

        <section className="bg-surface border border-line rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-ink mb-4">Adresse</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelClass}>Gateadresse</label>
              <input
                value={form.street_address}
                onChange={(e) => update("street_address", e.target.value)}
                maxLength={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Postnummer</label>
              <input
                inputMode="numeric"
                value={form.postal_code}
                onChange={(e) => updateDigits("postal_code", e.target.value, 4)}
                className={inputClass}
                placeholder="0150"
              />
            </div>
            <div>
              <label className={labelClass}>Poststed</label>
              <input
                value={form.city}
                onChange={(e) => updateName("city", e.target.value, 60)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Land</label>
              <input
                value={form.country}
                onChange={(e) => updateName("country", e.target.value, 60)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full bg-brand text-white rounded-lg py-2.5 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {saving ? "Lagrer..." : "Lagre endringer"}
        </button>
      </form>
    </main>
  );
}