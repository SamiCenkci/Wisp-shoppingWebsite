"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";

type Image = { id: string; url: string };
type Listing = {
  id: string;
  title: string;
  price_ore: number;
  category: string;
  status: string;
  municipality: string;
  county: string;
  created_at: string;
  images?: Image[];
};
type Buyer = { id: string; name: string; display_name: string };

const TABS = [
  { key: "all", label: "Alle" },
  { key: "active", label: "Aktive" },
  { key: "sold", label: "Solgt" },
  { key: "expired", label: "Utløpt" },
];

const STATUS_LABEL: Record<string, string> = {
  active: "Aktiv",
  sold: "Solgt",
  expired: "Utløpt",
};

export default function MyListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [soldModal, setSoldModal] = useState<{ listingId: string; title: string } | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [reviewable, setReviewable] = useState<Record<string, boolean>>({});
  
  function load() {
    api("/api/listings/mine")
      .then((data) => setListings(data ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function closeOnOutside() {
      setOpenMenu(null);
    }
    window.addEventListener("click", closeOnOutside);
    return () => window.removeEventListener("click", closeOnOutside);
  }, []);

  useEffect(() => {
    const sold = listings.filter((l) => l.status === "sold");
    if (sold.length === 0) return;
    Promise.all(
      sold.map((l) =>
        api(`/api/listings/${l.id}/can-review`)
          .then((d) => [l.id, Boolean(d.can_review)] as const)
          .catch(() => [l.id, false] as const)
      )
    ).then((pairs) => setReviewable(Object.fromEntries(pairs)));
  }, [listings]);

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await api(`/api/listings/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
  }

  async function setStatus(id: string, status: string) {
    try {
      await api(`/api/listings/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
  }

  async function openSoldModal(listingId: string, title: string) {
    setSoldModal({ listingId, title });
    setLoadingBuyers(true);
    try {
      const data = await api(`/api/listings/${listingId}/buyers`);
      setBuyers(data ?? []);
    } catch {
      setBuyers([]);
    } finally {
      setLoadingBuyers(false);
    }
  }

  async function confirmSold(buyerId: string) {
    if (!soldModal) return;
    try {
      await api(`/api/listings/${soldModal.listingId}/sold`, {
        method: "PUT",
        body: JSON.stringify({ buyer_id: buyerId }),
      });
      setListings((prev) =>
        prev.map((l) => (l.id === soldModal.listingId ? { ...l, status: "sold" } : l))
      );
      setSoldModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke markere som solgt");
    }
  }

  const filtered = listings.filter((l) => {
    const matchesTab = tab === "all" || l.status === tab;
    const matchesSearch = l.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  function countFor(key: string) {
    if (key === "all") return listings.length;
    return listings.filter((l) => l.status === key).length;
  }

  return (
    <main className="max-w-[1400px] mx-auto px-[5%] py-8 flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-72 shrink-0">
        <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-ink">Mine annonser</h1>
          </div>

          <button
            onClick={() => router.push("/new")}
            className="w-full mb-4 px-4 py-2.5 rounded-xl text-white font-medium bg-brand hover:bg-brand-dark text-sm shadow-sm"
          >
            + Ny annonse
          </button>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk i mine annonser..."
            className="w-full mb-4 px-3.5 py-2.5 rounded-xl border border-line bg-subtle outline-none focus:bg-surface focus:border-brand text-sm"
          />

          <div className="flex flex-col gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? "bg-brand-lightest text-brand" : "text-ink-secondary hover:bg-subtle"
                }`}
              >
                <span>{t.label}</span>
                <span className={tab === t.key ? "text-brand" : "text-ink-muted"}>{countFor(t.key)}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="flex-1">
        {loading ? (
          <p className="text-ink-secondary">Laster...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-16 text-center">
            <p className="text-ink-secondary">Ingen annonser her.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => router.push(`/listings/${listing.id}`)}
                  className="w-28 h-28 rounded-xl overflow-hidden bg-subtle shrink-0 cursor-pointer"
                >
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">
                      Ingen bilde
                    </div>
                  )}
                </div>

                <div
                  onClick={() => router.push(`/listings/${listing.id}`)}
                  className="flex-1 cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="font-medium text-ink truncate">{listing.title}</h2>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                        listing.status === "active"
                          ? "bg-brand-lightest text-brand"
                          : listing.status === "sold"
                          ? "bg-subtle text-ink-secondary"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {STATUS_LABEL[listing.status] ?? listing.status}
                    </span>
                  </div>
                  <p className="text-brand font-semibold text-lg mt-1">
                    {(listing.price_ore / 100).toLocaleString("nb-NO")} kr
                  </p>
                  <p className="text-sm text-ink-secondary mt-0.5">
                    {listing.category} · {listing.municipality}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {listing.status !== "sold" ? (
                    <button
                      onClick={() => openSoldModal(listing.id, listing.title)}
                      className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand whitespace-nowrap"
                    >
                      Marker solgt
                    </button>
                  ) : (
                    <>
                      {reviewable[listing.id] && (
                        <button
                          onClick={() => router.push(`/review/${listing.id}`)}
                          className="px-3.5 py-2 rounded-xl bg-brand text-white text-sm hover:bg-brand-dark whitespace-nowrap"
                        >
                          Gi vurdering
                        </button>
                      )}
                      <button
                        onClick={() => setStatus(listing.id, "active")}
                        className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand whitespace-nowrap"
                      >
                        Aktiver
                      </button>
                    </>
                  )}

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === listing.id ? null : listing.id);
                      }}
                      className="w-10 h-10 rounded-xl border border-line text-ink-secondary hover:border-brand hover:text-brand flex items-center justify-center text-lg leading-none"
                      aria-label="Flere valg"
                    >
                      ⋮
                    </button>

                    {openMenu === listing.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 mt-1 w-44 bg-surface border border-line rounded-xl shadow-lg py-1 z-20"
                      >
                        <button
                          onClick={() => router.push(`/listings/${listing.id}`)}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-subtle"
                        >
                          Se annonsen
                        </button>
                        <button
                          onClick={() => router.push(`/edit/${listing.id}`)}
                          className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-subtle"
                        >
                          Endre annonsen
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: listing.id, title: listing.title })}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Slett
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {soldModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSoldModal(null)}
        >
          <div
            className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink mb-1">Hvem solgte du til?</h2>
            <p className="text-sm text-ink-secondary mb-5">{soldModal.title}</p>

            {loadingBuyers ? (
              <p className="text-ink-secondary text-sm py-4">Laster...</p>
            ) : buyers.length === 0 ? (
              <p className="text-ink-secondary text-sm py-4">
                Ingen har sendt melding om denne annonsen ennå, så det er ingen kjøper å velge.
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {buyers.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => confirmSold(b.id)}
                    className="w-full text-left px-4 py-3 rounded-xl border border-line hover:border-brand hover:bg-subtle flex items-center gap-3"
                  >
                    <span className="w-9 h-9 rounded-full bg-brand-lightest text-brand flex items-center justify-center font-bold shrink-0">
                      {(b.display_name || b.name).charAt(0).toUpperCase()}
                    </span>
                    <span className="text-ink font-medium">{b.display_name || b.name}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setSoldModal(null)}
              className="mt-5 w-full py-2.5 rounded-xl border border-line text-ink-secondary hover:text-ink"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Slette annonsen?"
        message={deleteTarget ? `"${deleteTarget.title}" blir borte for godt.` : undefined}
        confirmLabel="Slett"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}