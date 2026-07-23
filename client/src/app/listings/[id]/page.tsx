"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { expiryLabel } from "@/lib/expiry";
import dynamic from "next/dynamic";
import { ATTRIBUTE_LABELS } from "@/lib/categories";

const ListingMap = dynamic(() => import("@/components/ListingMap"), { ssr: false });

const conditionLabels: Record<string, string> = {
  new: "Ny",
  like_new: "Som ny",
  good: "God",
  fair: "Brukbar",
};

const attrLabels: Record<string, string> = {
  plattform: "Plattform",
  storrelse: "Størrelse",
  skostorrelse: "Skostørrelse",
  drivstoff: "Drivstoff",
  sykkeltype: "Type sykkel",
};

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
  ad_type?: string;
  sold_to?: string;
  view_count?: number;
  images?: Image[];
  latitude?: number;
  longitude?: number;
  street_address?: string;
  sub_category?: string;
  product_category?: string;
  attributes?: Record<string, string>;
  deleted_at?: string | null;
};
type Seller = {
  id: string;
  name: string;
  display_name: string;
  avatar_url: string;
  created_at: string;
};
type Buyer = { id: string; name: string; display_name: string };

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [similar, setSimilar] = useState<Listing[]>([]);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [isOwn, setIsOwn] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [soldModal, setSoldModal] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  
  function loadListing() {
    return api(`/api/listings/${params.id}`).then((data) => {
      setListing(data.listing);
      setImages(data.images ?? []);
      setSimilar(data.similar ?? []);
      setSeller(data.seller ?? null);
      setLikeCount(data.like_count ?? 0);
      setLiked(data.liked_by_me ?? false);
      const stored = localStorage.getItem("user");
      if (stored && data.seller) {
        try {
          const me = JSON.parse(stored);
          setIsOwn(me.id === data.seller.id);
          useEffect(() => {
    if (!listing || listing.status !== "sold") {
      setCanReview(false);
      return;
    }
    if (!localStorage.getItem("token")) {
      setCanReview(false);
      return;
    }
    api(`/api/listings/${listing.id}/can-review`)
      .then((data) => setCanReview(Boolean(data.can_review)))
      .catch(() => setCanReview(false));
  }, [listing]);
        } catch {}
      }
      return data;
    });
  }

  useEffect(() => {
    setLoading(true);
    loadListing()
      .then(() => window.scrollTo(0, 0))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function openSoldModal() {
    setSoldModal(true);
    setLoadingBuyers(true);
    try {
      const data = await api(`/api/listings/${params.id}/buyers`);
      setBuyers(data ?? []);
    } catch {
      setBuyers([]);
    } finally {
      setLoadingBuyers(false);
    }
  }

  async function confirmSold(buyerId: string) {
    try {
      await api(`/api/listings/${params.id}/sold`, {
        method: "PUT",
        body: JSON.stringify({ buyer_id: buyerId }),
      });
      setSoldModal(false);
      await loadListing();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke markere som solgt");
    }
  }

  async function toggleLike() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!listing) return;
    try {
      await api(`/api/listings/${listing.id}/favorite`, {
        method: liked ? "DELETE" : "POST",
      });
      const data = await api(`/api/listings/${listing.id}`);
      setLikeCount(data.like_count ?? 0);
      setAttributes(data.attributes && typeof data.attributes === "object" ? data.attributes : {});
      setLiked(data.liked_by_me ?? false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke oppdatere");
    }
  }

  async function startConversation() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    if (!seller || !listing) return;
    try {
      const conv = await api("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ listing_id: listing.id, seller_id: seller.id }),
      });
      router.push(`/chat?c=${conv.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke starte samtale");
    }
  }

  if (loading) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-ink-secondary">Laster...</p>;
  if (error) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-red-600">{error}</p>;
  if (!listing) return <p className="max-w-3xl mx-auto px-[5%] py-10">Annonse ikke funnet.</p>;
  
  if (listing.deleted_at) {
    return (
      <main className="max-w-2xl mx-auto px-[5%] py-16 text-center">
        <div className="text-5xl mb-4">🗑️</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Annonsen er slettet</h1>
        <p className="text-ink-secondary mb-8">
          &laquo;{listing.title}&raquo; er ikke lenger tilgjengelig. Meldingene dine om annonsen er
          fortsatt bevart.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark"
          >
            Se andre annonser
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="px-5 py-2.5 rounded-xl border border-line text-ink-secondary font-medium hover:border-brand hover:text-brand"
          >
            Gå til meldinger
          </button>
        </div>
      </main>
    );
  }

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
            {listing.ad_type === "giveaway" ? "Gratis" : `${(listing.price_ore / 100).toLocaleString("nb-NO")} kr`}
          </p>

          <button
            onClick={toggleLike}
            className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
              liked
                ? "border-brand bg-brand-lightest text-brand"
                : "border-line text-ink-secondary hover:border-brand hover:text-brand"
            }`}
          >
            <span>{liked ? "❤️" : "🤍"}</span>
            <span>{likeCount} liker</span>
          </button>

          <div className="flex flex-wrap gap-2 mt-4 text-sm">
            <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{listing.category}</span>
            {listing.sub_category && (
              <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{listing.sub_category}</span>
            )}
            {listing.product_category && (
              <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{listing.product_category}</span>
            )}
            <span className="bg-subtle text-ink-secondary rounded-full px-3 py-1">
              {conditionLabels[listing.condition] ?? listing.condition}
            </span>
          </div>

          {Object.keys(attributes).length > 0 && (
            <dl className="mt-5 border border-line rounded-xl divide-y divide-line text-sm">
              {Object.entries(attributes).map(([key, value]) =>
                value ? (
                  <div key={key} className="flex justify-between px-4 py-2.5">
                    <dt className="text-ink-secondary">{ATTRIBUTE_LABELS[key] ?? key}</dt>
                    <dd className="text-ink font-medium">{value}</dd>
                  </div>
                ) : null
              )}
            </dl>
          )}
          <p className="mt-5 text-ink whitespace-pre-wrap">{listing.description}</p>
          <div className="mt-5 pt-5 border-t border-line text-sm text-ink-secondary space-y-1">
            <p>📍 {listing.municipality}, {listing.county}</p>
            <p>⏱ {expiryLabel(listing.created_at)}</p>
            <p>👁 {listing.view_count ?? 0} visninger</p>
          </div>
          {listing.latitude && listing.longitude ? (
            <div className="mt-5">
              <p className="text-sm font-medium text-ink mb-2">Omtrentlig område</p>
              <ListingMap
                latitude={listing.latitude}
                longitude={listing.longitude}
                label={`${listing.municipality}, ${listing.county}`}
              />
            </div>
          ) : null}

          {isOwn ? (
            <div className="mt-6 space-y-3">
              <div className="w-full bg-subtle text-ink-muted rounded-lg py-3 font-medium text-center border border-line">
                Dette er din egen annonse
              </div>
              {listing.status !== "sold" && (
                <button
                  onClick={openSoldModal}
                  className="w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark"
                >
                  Marker som solgt
                </button>
              )}
              <button
                onClick={() => router.push(`/edit/${listing.id}`)}
                className="w-full border border-line text-ink-secondary rounded-lg py-3 font-medium hover:border-brand hover:text-brand"
              >
                Endre annonsen
              </button>
            </div>
          ) : (
            <button
              onClick={startConversation}
              className="mt-6 w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark"
            >
              Send melding til selger
            </button>
          )}

          {canReview && (
            <button
              onClick={() => router.push(`/review/${listing.id}`)}
              className="mt-3 w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark"
            >
              Gi vurdering
            </button>
          )}

          {seller && !isOwn && (
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
                    {s.ad_type === "giveaway" ? "Gratis" : `${(s.price_ore / 100).toLocaleString("nb-NO")} kr`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {soldModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setSoldModal(false)}
        >
          <div
            className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink mb-1">Hvem solgte du til?</h2>
            <p className="text-sm text-ink-secondary mb-5">{listing.title}</p>

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
              onClick={() => setSoldModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl border border-line text-ink-secondary hover:text-ink"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}
    </main>
  );
}