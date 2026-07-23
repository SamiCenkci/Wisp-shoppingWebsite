"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import {
  CATEGORIES,
  CATEGORY_ICONS,
  HIDDEN_FROM_NAV,
  getSubs,
  getProducts,
  getAttributes,
} from "@/lib/categories";

type Image = { id: string; url: string };
type Listing = {
  id: string;
  title: string;
  description: string;
  price_ore: number;
  category: string;
  county: string;
  municipality: string;
  ad_type?: string;
  liked_by_me?: boolean;
  images?: Image[];
};

function HomeInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    sub_category: "",
    product_category: "",
    place: "",
    condition: "",
    ad_type: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
  });
  const [attrFilters, setAttrFilters] = useState<Record<string, string>>({});
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const emptyFilters = {
    query: "",
    category: "",
    sub_category: "",
    product_category: "",
    place: "",
    condition: "",
    ad_type: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
  };

  function seedLiked(data: Listing[]) {
    const ids = new Set<string>();
    (data ?? []).forEach((l) => {
      if (l.liked_by_me) ids.add(l.id);
    });
    setLikedIds(ids);
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      if (Array.isArray(saved)) setRecentSearches(saved);
    } catch {}

    const q = searchParams.get("q") ?? "";
    if (q) {
      setFilters((prev) => ({ ...prev, query: q }));
      runSearch({ query: q });
    } else {
      setIsSearchResult(false);
      setFilters(emptyFilters);
      setAttrFilters({});
      api("/api/listings")
        .then((data) => {
          setListings(data ?? []);
          seedLiked(data ?? []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function update(field: string, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function saveSearch(term: string) {
    const t = term.trim();
    if (!t) return;
    setRecentSearches((prev) => {
      const next = [t, ...prev.filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(0, 5);
      localStorage.setItem("recentSearches", JSON.stringify(next));
      return next;
    });
  }

  function clearRecent() {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  }

  async function runSearch(override?: Partial<typeof filters>, attrs?: Record<string, string>) {
    setLoading(true);
    const f = { ...filters, ...override };
    try {
      const body = {
        query: f.query,
        category: f.category,
        sub_category: f.sub_category,
        product_category: f.product_category,
        attributes: attrs ?? attrFilters,
        place: f.place,
        condition: f.condition,
        ad_type: f.ad_type,
        min_price: f.min_price ? Math.round(parseFloat(f.min_price) * 100) : 0,
        max_price: f.max_price ? Math.round(parseFloat(f.max_price) * 100) : 0,
        sort_by: f.sort_by,
      };
      const data = await api("/api/listings/search", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setListings(data ?? []);
      seedLiked(data ?? []);
      setIsSearchResult(true);
      if (f.query) saveSearch(f.query);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function resetAll() {
    setFilters(emptyFilters);
    setAttrFilters({});
    setLoading(true);
    try {
      const data = await api("/api/listings");
      setListings(data ?? []);
      seedLiked(data ?? []);
      setIsSearchResult(false);
    } finally {
      setLoading(false);
    }
  }

  function pickCategory(cat: string) {
    const next = filters.category === cat ? "" : cat;
    setFilters((prev) => ({ ...prev, category: next, sub_category: "", product_category: "" }));
    setAttrFilters({});
    if (!next) {
      resetAll();
      return;
    }
    runSearch({ category: next, sub_category: "", product_category: "" }, {});
  }

  function pickSub(sub: string) {
    const next = filters.sub_category === sub ? "" : sub;
    setFilters((prev) => ({ ...prev, sub_category: next, product_category: "" }));
    setAttrFilters({});
    runSearch({ sub_category: next, product_category: "" }, {});
  }

  function pickProduct(prod: string) {
    const next = filters.product_category === prod ? "" : prod;
    setFilters((prev) => ({ ...prev, product_category: next }));
    setAttrFilters({});
    runSearch({ product_category: next }, {});
  }

  function pickAttr(key: string, value: string) {
    const next = { ...attrFilters, [key]: value };
    setAttrFilters(next);
    runSearch(undefined, next);
  }

  async function toggleLike(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const isLiked = likedIds.has(id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(id);
      else next.add(id);
      return next;
    });
    try {
      await api(`/api/listings/${id}/favorite`, { method: isLiked ? "DELETE" : "POST" });
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  }

  const inputClass = "w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-brand";

  const filterSubs = getSubs(filters.category);
  const filterProducts = getProducts(filters.category, filters.sub_category);
  const filterAttrs = getAttributes(filters.category, filters.sub_category, filters.product_category);

  return (
    <main>
      <div className="border-b border-line bg-surface">
        <div className="max-w-[1400px] mx-auto px-[5%]">
          <nav className="py-4">
            {!filters.category ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-4 gap-y-3">
                {CATEGORIES.filter((c) => !HIDDEN_FROM_NAV.includes(c)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => pickCategory(cat)}
                    className="flex items-center gap-2 text-left text-xs leading-tight text-ink-secondary hover:text-brand transition-colors"
                  >
                    <span className="text-base leading-none shrink-0">{CATEGORY_ICONS[cat] ?? "🏷️"}</span>
                    <span>{cat}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center flex-wrap gap-1.5 text-sm mb-3">
                  <button onClick={() => pickCategory("")} className="text-brand hover:text-brand-dark">
                    Alle kategorier
                  </button>
                  <span className="text-ink-muted">/</span>
                  {filters.sub_category ? (
                    <>
                      <button onClick={() => pickSub(filters.sub_category)} className="text-brand hover:text-brand-dark">
                        {filters.category}
                      </button>
                      <span className="text-ink-muted">/</span>
                      <span className="font-medium text-ink">{filters.sub_category}</span>
                    </>
                  ) : (
                    <span className="font-medium text-ink">{filters.category}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2">
                  {(filters.sub_category
                    ? filterProducts.map((p) => p.name)
                    : filterSubs.map((s) => s.name)
                  ).map((name) => {
                    const active = filters.sub_category
                      ? filters.product_category === name
                      : filters.sub_category === name;
                    return (
                      <button
                        key={name}
                        onClick={() => (filters.sub_category ? pickProduct(name) : pickSub(name))}
                        className={`text-left text-xs leading-tight transition-colors ${
                          active ? "text-brand font-medium" : "text-ink-secondary hover:text-brand"
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-[5%] py-8 flex gap-8">
        {isSearchResult && (
          <aside className="w-64 shrink-0 hidden lg:block">
            <div className="bg-surface border border-line rounded-2xl p-5 shadow-sm sticky top-24">
              <h2 className="font-semibold text-ink mb-4">Filtrer søk</h2>

              <div className="space-y-4">
                {filterSubs.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Underkategori</label>
                    <select
                      value={filters.sub_category}
                      onChange={(e) => pickSub(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Alle</option>
                      {filterSubs.map((s) => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterProducts.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1">Produktkategori</label>
                    <select
                      value={filters.product_category}
                      onChange={(e) => pickProduct(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Alle</option>
                      {filterProducts.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {filterAttrs.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-ink mb-1">{field.label}</label>
                    <select
                      value={attrFilters[field.key] ?? ""}
                      onChange={(e) => pickAttr(field.key, e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Alle</option>
                      {field.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Sted eller postnummer</label>
                  <input
                    value={filters.place}
                    onChange={(e) => update("place", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && runSearch()}
                    className={inputClass}
                    placeholder="f.eks. Oslo eller 0150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Type annonse</label>
                  <select value={filters.ad_type} onChange={(e) => update("ad_type", e.target.value)} className={inputClass}>
                    <option value="">Alle</option>
                    <option value="sale">Til salgs</option>
                    <option value="giveaway">Gis bort</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Prisklasse</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-ink-muted mb-1">Fra</label>
                      <input type="number" value={filters.min_price} onChange={(e) => update("min_price", e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} className={inputClass} placeholder="0 kr" />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-muted mb-1">Til</label>
                      <input type="number" value={filters.max_price} onChange={(e) => update("max_price", e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()} className={inputClass} placeholder="Maks" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Tilstand</label>
                  <select value={filters.condition} onChange={(e) => update("condition", e.target.value)} className={inputClass}>
                    <option value="">Alle</option>
                    <option value="new">Ny</option>
                    <option value="like_new">Som ny</option>
                    <option value="good">God</option>
                    <option value="fair">Brukbar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Sortering</label>
                  <select value={filters.sort_by} onChange={(e) => update("sort_by", e.target.value)} className={inputClass}>
                    <option value="newest">Nyeste først</option>
                    <option value="price_asc">Pris: lav til høy</option>
                    <option value="price_desc">Pris: høy til lav</option>
                  </select>
                </div>

                <button onClick={() => runSearch()} className="w-full bg-brand text-white rounded-lg py-2 font-medium hover:bg-brand-dark">
                  Bruk filtre
                </button>
                <button onClick={resetAll} className="w-full text-sm text-ink-secondary hover:text-brand underline">
                  Nullstill
                </button>
              </div>
            </div>
          </aside>
        )}

        <section className="flex-1">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-semibold text-ink">
              {isSearchResult ? "Søkeresultater" : "Siste annonser"}
              <span className="text-ink-muted font-normal text-base ml-2">
                ({listings.length})
              </span>
            </h1>
            {isSearchResult && (
              <button onClick={resetAll} className="text-sm text-ink-secondary hover:text-brand underline">
                Vis alle annonser
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-line bg-surface">
                  <div className="h-44 bg-subtle animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-subtle rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-subtle rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-16 text-center">
              <p className="text-ink-secondary">
                {isSearchResult ? "Ingen annonser matcher søket ditt." : "Ingen annonser ennå."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => router.push(`/listings/${listing.id}`)}
                  className="group cursor-pointer rounded-2xl overflow-hidden border border-line bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="h-44 w-full overflow-hidden bg-subtle relative">
                    <button
                      onClick={(e) => toggleLike(e, listing.id)}
                      className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-surface/90 backdrop-blur flex items-center justify-center text-lg hover:scale-110 transition-transform shadow-sm"
                      aria-label="Lik annonse"
                    >
                      {likedIds.has(listing.id) ? "❤️" : "🤍"}
                    </button>
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-ink-muted">Ingen bilde</div>
                    )}
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-surface/90 text-ink-secondary backdrop-blur">
                      {listing.category}
                    </span>
                    {listing.ad_type === "giveaway" && (
                      <span className="absolute bottom-3 left-3 px-2 py-1 rounded-full text-xs font-medium bg-brand text-white">
                        Gis bort
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate text-ink">{listing.title}</h3>
                    <p className="font-semibold mt-1 text-lg text-ink">
                      {listing.ad_type === "giveaway" ? "Gratis" : `${(listing.price_ore / 100).toLocaleString("nb-NO")} kr`}
                    </p>
                    <p className="text-sm mt-1 text-ink-secondary">{listing.municipality}, {listing.county}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="max-w-[1400px] mx-auto px-[5%] py-8 text-ink-secondary">Laster...</main>}>
      <HomeInner />
    </Suspense>
  );
}