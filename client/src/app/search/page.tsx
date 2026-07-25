"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

type Image = { id: string; url: string };
type Listing = {
  id: string;
  title: string;
  description: string;
  price_ore: number;
  category: string;
  county: string;
  municipality: string;
  images?: Image[];
};

export default function SearchPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    county: "",
    min_price: "",
    max_price: "",
    sort_by: "newest",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<Listing[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function activeFilterCount() {
    let n = 0;
    if (filters.category) n++;
    if (filters.county) n++;
    if (filters.min_price) n++;
    if (filters.max_price) n++;
    if (filters.sort_by !== "newest") n++;
    return n;
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const body = {
        query: filters.query,
        category: filters.category,
        county: filters.county,
        min_price: filters.min_price ? Math.round(parseFloat(filters.min_price) * 100) : 0,
        max_price: filters.max_price ? Math.round(parseFloat(filters.max_price) * 100) : 0,
        sort_by: filters.sort_by,
      };
      const data = await api("/api/listings/search", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResults(data ?? []);
      setSearched(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilters((prev) => ({
      ...prev,
      category: "",
      county: "",
      min_price: "",
      max_price: "",
      sort_by: "newest",
    }));
  }

  const inputClass =
    "w-full border border-line rounded-lg px-3 py-2 outline-none focus:border-brand";
  const count = activeFilterCount();

  return (
    <main className="max-w-[1400px] mx-auto px-[5%] py-10">
      <h1 className="text-2xl font-semibold mb-6 text-ink">{t("home.searchListings")}</h1>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            placeholder={t("home.searchQueryPlaceholder")}
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
            className="flex-1 px-5 py-3 rounded-full border border-line bg-surface text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="px-5 py-3 rounded-full border border-line bg-surface text-ink-secondary font-medium hover:border-brand hover:text-brand flex items-center gap-2"
          >
            {t("home.filter")}
            {count > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand text-white text-xs">
                {count}
              </span>
            )}
            <span className={`transition-transform ${showFilters ? "rotate-180" : ""}`}>▾</span>
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-full bg-brand text-white font-medium hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? t("home.searching") : t("nav.search")}
          </button>
        </div>

        {showFilters && (
          <div className="mt-3 bg-surface border border-line rounded-2xl p-5 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("home.category")}</label>
                <input
                  placeholder={t("home.categoryPlaceholder")}
                  value={filters.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("home.county")}</label>
                <input
                  placeholder={t("home.countyPlaceholder")}
                  value={filters.county}
                  onChange={(e) => update("county", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("home.sorting")}</label>
                <select
                  value={filters.sort_by}
                  onChange={(e) => update("sort_by", e.target.value)}
                  className={inputClass}
                >
                  <option value="newest">{t("home.sortNewest")}</option>
                  <option value="price_asc">{t("home.sortPriceAsc")}</option>
                  <option value="price_desc">{t("home.sortPriceDesc")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("home.minPriceKr")}</label>
                <input
                  type="number"
                  value={filters.min_price}
                  onChange={(e) => update("min_price", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">{t("home.maxPriceKr")}</label>
                <input
                  type="number"
                  value={filters.max_price}
                  onChange={(e) => update("max_price", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            {count > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-sm text-ink-secondary hover:text-brand underline"
              >
                {t("home.resetFilters")}
              </button>
            )}
          </div>
        )}
      </form>

      {searched && results.length === 0 && (
        <p className="text-ink-secondary mt-6">{t("home.noMatches")}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {results.map((listing) => (
          <div
            key={listing.id}
            onClick={() => router.push(`/listings/${listing.id}`)}
            className="group cursor-pointer rounded-2xl overflow-hidden border border-line bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="h-48 w-full overflow-hidden bg-subtle">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0].url}
                  alt={listing.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-ink-muted">
                  {t("home.noImage")}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-medium truncate text-ink">{listing.title}</h3>
              <p className="font-semibold mt-1 text-lg text-ink">
                {(listing.price_ore / 100).toLocaleString("nb-NO")} kr
              </p>
              <p className="text-sm mt-1 text-ink-secondary">
                {listing.municipality}, {listing.county}
              </p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}