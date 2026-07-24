"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ATTRIBUTE_LABELS } from "@/lib/categories";
import ConfirmDialog from "@/components/ConfirmDialog";

type SavedSearch = {
  id: string;
  name: string;
  query: string;
  category: string;
  sub_category: string;
  product_category: string;
  attributes: Record<string, string>;
  place: string;
  condition: string;
  ad_type: string;
  min_price: number;
  max_price: number;
  created_at: string;
};

const conditionLabels: Record<string, string> = {
  new: "Ny",
  like_new: "Som ny",
  good: "God",
  fair: "Brukbar",
};

export default function SavedSearchesPage() {
  const router = useRouter();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState("");

  function load() {
    api("/api/saved-searches")
      .then((data) => setSearches(data ?? []))
      .catch(() => setSearches([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmRemove() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    setError("");
    try {
      await api(`/api/saved-searches/${id}`, { method: "DELETE" });
      setSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke slette");
    }
  }

  // Turn a saved search back into a homepage URL.
  function openSearch(s: SavedSearch) {
    const params = new URLSearchParams();
    if (s.query) params.set("q", s.query);
    if (s.category) params.set("category", s.category);
    if (s.sub_category) params.set("sub", s.sub_category);
    if (s.product_category) params.set("product", s.product_category);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function describe(s: SavedSearch): string[] {
    const parts: string[] = [];
    if (s.query) parts.push(`«${s.query}»`);
    if (s.category) parts.push(s.category);
    if (s.sub_category) parts.push(s.sub_category);
    if (s.product_category) parts.push(s.product_category);
    Object.entries(s.attributes ?? {}).forEach(([k, v]) => {
      if (v) parts.push(`${ATTRIBUTE_LABELS[k] ?? k}: ${v}`);
    });
    if (s.place) parts.push(`📍 ${s.place}`);
    if (s.condition) parts.push(conditionLabels[s.condition] ?? s.condition);
    if (s.ad_type === "giveaway") parts.push("Gis bort");
    if (s.ad_type === "sale") parts.push("Til salgs");
    if (s.min_price > 0) parts.push(`Fra ${s.min_price / 100} kr`);
    if (s.max_price > 0) parts.push(`Til ${s.max_price / 100} kr`);
    return parts;
  }

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-bold text-ink mb-2">Lagrede søk</h1>
      <p className="text-ink-secondary mb-6">
        Du får en e-post når det kommer nye annonser som matcher.
      </p>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-ink-secondary">Laster...</p>
      ) : searches.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center">
          <p className="text-ink-secondary mb-4">Du har ingen lagrede søk ennå.</p>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark"
          >
            Finn noe å lagre
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((s) => (
            <div key={s.id} className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold text-ink">{s.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {describe(s).length === 0 ? (
                      <span className="text-xs text-ink-muted">Alle annonser</span>
                    ) : (
                      describe(s).map((p, i) => (
                        <span key={i} className="text-xs bg-subtle text-ink-secondary rounded-full px-2.5 py-1">
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget({ id: s.id, name: s.name })}
                  className="shrink-0 text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Slett
                </button>
              </div>

              <button
                onClick={() => openSearch(s)}
                className="mt-4 text-sm text-brand font-medium hover:text-brand-dark"
              >
                Se resultater →
              </button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Slette det lagrede søket?"
        message={deleteTarget ? `«${deleteTarget.name}» blir borte, og du får ikke lenger varsler for det.` : undefined}
        confirmLabel="Slett"
        danger
        onConfirm={confirmRemove}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}