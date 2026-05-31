"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

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

  async function handleDelete(id: string) {
    if (!confirm("Slette denne annonsen?")) return;
    try {
      await api(`/api/listings/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sletting feilet");
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api(`/api/listings/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke oppdatere");
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
      {/* Left sidebar — tabs + search */}
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

      {/* Right — listings */}
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
                      onClick={() => setStatus(listing.id, "sold")}
                      className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand whitespace-nowrap"
                    >
                      Marker solgt
                    </button>
                  ) : (
                    <button
                      onClick={() => setStatus(listing.id, "active")}
                      className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand whitespace-nowrap"
                    >
                      Aktiver
                    </button>
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
                          onClick={() => handleDelete(listing.id)}
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
    </main>
  );
}