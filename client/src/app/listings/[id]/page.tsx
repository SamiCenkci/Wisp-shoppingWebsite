"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { expiryLabel } from "@/lib/expiry";

type Image = { id: string; url: string };
type Listing = {
  id: string;
  title: string;
  description: string;
  price_ore: number;
  category: string;
  condition: string;
  county: string;
  municipality: string;
  created_at: string;
  status: string;
  images?: Image[];
};
type Seller = {
  id: string;
  name: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api(`/api/listings/${params.id}`)
      .then((data) => {
        setListing(data.listing);
        setImages(data.images ?? []);
        setSimilar(data.similar ?? []);
        setSeller(data.seller ?? null);
        window.scrollTo(0, 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-ink-secondary">Laster...</p>;
  if (error) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-red-600">{error}</p>;
  if (!listing) return <p className="max-w-3xl mx-auto px-[5%] py-10">Annonse ikke funnet.</p>;

  return (
    <main className="max-w-[1100px] mx-auto px-[5%] py-8">
      <button onClick={() => router.push("/")} className="text-brand text-sm mb-4 hover:underline">
        ← Tilbake til annonser
      </button>
      {listing.status !== "active" && (
        <div className="mb-4 rounded-xl bg-subtle border border-line px-4 py-3 text-sm text-ink-secondary">
          {listing.status === "sold"
            ? "Denne annonsen er markert som solgt og er ikke lenger aktiv."
            : "Denne annonsen er utløpt og er ikke lenger aktiv."}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {images.length > 0 ? (
            <div className="space-y-2">
              <img src={images[0].url} alt={listing.title} className="w-full h-80 object-cover rounded-2xl" />
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.slice(1).map((img) => (
                    <img key={img.id} src={img.url} alt={listing.title} className="w-full h-20 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-80 rounded-2xl bg-subtle flex items-center justify-center text-ink-muted">
              Ingen bilde
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 self-start">
          <h1 className="text-3xl font-bold text-ink">{listing.title}</h1>
          <p className="text-3xl text-brand font-bold mt-3">
            {(listing.price_ore / 100).toLocaleString("nb-NO")} kr
          </p>
          <div className="flex gap-2 mt-4 text-sm">
            <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{listing.category}</span>
            <span className="bg-subtle text-ink-secondary rounded-full px-3 py-1">{listing.condition}</span>
          </div>
          <p className="mt-5 text-ink whitespace-pre-wrap">{listing.description}</p>
          <div className="mt-5 pt-5 border-t border-line text-sm text-ink-secondary space-y-1">
            <p>📍 {listing.municipality}, {listing.county}</p>
            <p>⏱ {expiryLabel(listing.created_at)}</p>
          </div>
          
          <button
            disabled={listing.status !== "active"}
            onClick={async () => {
              const token = localStorage.getItem("token");
              if (!token) {
                router.push("/login");
                return;
              }
              if (!seller) return;
              try {
                const conv = await api("/api/conversations", {
                  method: "POST",
                  body: JSON.stringify({ listing_id: listing.id, seller_id: seller.id }),
                });
                router.push(`/chat?c=${conv.id}`);
              } catch (err) {
                alert(err instanceof Error ? err.message : "Kunne ikke starte samtale");
              }
            }}
            className="mt-6 w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {listing.status === "active" ? "Send melding til selger" : "Ikke tilgjengelig"}
          </button>

          {seller && (
            <div
              onClick={() => router.push(`/profile/${seller.id}`)}
              className="mt-6 flex items-center gap-3 p-4 rounded-xl border border-line bg-surface cursor-pointer hover:border-brand transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-brand-lightest overflow-hidden flex items-center justify-center shrink-0">
                {seller.avatar_url ? (
                  <img src={seller.avatar_url} alt={seller.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand font-bold">
                    {(seller.display_name || seller.name).charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{seller.display_name || seller.name}</p>
                <p className="text-xs text-ink-secondary">
                  Medlem siden{" "}
                  {new Date(seller.created_at).toLocaleDateString("nb-NO", { year: "numeric", month: "long" })}
                </p>
              </div>
              <span className="text-brand text-sm">Se profil →</span>
            </div>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ink mb-5">Lignende annonser</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {similar.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/listings/${s.id}`)}
                className="group cursor-pointer rounded-2xl overflow-hidden border border-line bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-36 w-full overflow-hidden bg-subtle">
                  {s.images && s.images.length > 0 ? (
                    <img src={s.images[0].url} alt={s.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">Ingen bilde</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate text-ink">{s.title}</h3>
                  <p className="font-semibold text-ink mt-0.5">
                    {(s.price_ore / 100).toLocaleString("nb-NO")} kr
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}