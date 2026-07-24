"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StarRating from "@/components/StarRating";

type Image = { id: string; url: string };
type Listing = {
  id: string;
  title: string;
  price_ore: number;
  category: string;
  municipality: string;
  county: string;
  images?: Image[];
};
type Profile = {
  id: string;
  name: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  phone: string;
  city: string;
  created_at: string;
};
type Review = {
  id: string;
  reviewer_name: string;
  reviewer_display_name: string;
  listing_title: string;
  communication: number;
  reliability: number;
  as_described: number;
  comment: string;
  created_at: string;
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwn, setIsOwn] = useState(false);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    api(`/api/users/${params.id}`)
      .then((data) => {
        setProfile(data.user);
        setListings(data.listings ?? []);
        const token = localStorage.getItem("token");
        const stored = localStorage.getItem("user");
        if (token && stored) {
          try {
            const me = JSON.parse(stored);
            setIsOwn(me.id === data.user.id);
          } catch {}
        } else {
          setIsOwn(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    api(`/api/users/${params.id}/reviews`)
      .then((data) => {
        setReviews(data.reviews ?? []);
        setReviewCount(Number(data.review_count ?? 0));
        setAvgRating(Number(data.average_rating ?? 0));
      })
      .catch(() => {});
  }, [params.id]);

  useEffect(() => {
    if (!isOwn) {
      setFavorites([]);
      return;
    }
    api(`/api/users/${params.id}/favorites`)
      .then((data) => setFavorites(data ?? []))
      .catch(() => setFavorites([]));
  }, [isOwn, params.id]);

  if (loading) return <p className="max-w-[1400px] mx-auto px-[5%] py-10 text-ink-secondary">Laster...</p>;
  if (!profile) return <p className="max-w-[1400px] mx-auto px-[5%] py-10">Bruker ikke funnet.</p>;

  const memberSince = new Date(profile.created_at).toLocaleDateString("nb-NO", { year: "numeric", month: "long" });
  const displayName = profile.display_name || profile.name;

  return (
    <main className="max-w-[1400px] mx-auto px-[5%] py-8 flex flex-col lg:flex-row gap-8">
      <aside className="lg:w-80 shrink-0">
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
          <div className="flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full bg-brand-lightest overflow-hidden flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-brand text-4xl font-bold">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-ink mt-4">{displayName}</h1>
            <p className="text-sm text-ink-secondary mt-1">Medlem siden {memberSince}</p>

            {reviewCount > 0 && (
              <div className="mt-3 flex flex-col items-center gap-1">
                <StarRating value={Math.round(avgRating)} readOnly size="sm" />
                <p className="text-sm text-ink-secondary">
                  <span className="font-semibold text-ink">{avgRating.toFixed(1)}</span> av 5 · {reviewCount}{" "}
                  {reviewCount === 1 ? "vurdering" : "vurderinger"}
                </p>
              </div>
            )}

            {isOwn && (
              <>
                <button
                  onClick={() => router.push("/profile/edit")}
                  className="mt-4 w-full px-4 py-2 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-brand hover:text-brand"
                >
                  Rediger profil
                </button>
                <button
                  onClick={() => router.push("/my-reviews")}
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-brand hover:text-brand"
                >
                  Vurderinger
                </button>
                <button
                  onClick={() => router.push("/saved-searches")}
                  className="mt-2 w-full px-4 py-2 rounded-xl border border-line text-ink-secondary text-sm font-medium hover:border-brand hover:text-brand"
                >
                  Lagrede søk
                </button>
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-line space-y-3 text-sm">
            <div className="flex items-center gap-2 text-ink-secondary">
              <span className="text-ink-muted">📋</span>
              <span>{listings.length} aktive annonser</span>
            </div>
            {profile.city && (
              <div className="flex items-center gap-2 text-ink-secondary">
                <span className="text-ink-muted">📍</span>
                <span>{profile.city}</span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2 text-ink-secondary">
                <span className="text-ink-muted">📞</span>
                <span>{profile.phone}</span>
              </div>
            )}
          </div>

          {profile.bio && (
            <div className="mt-6 pt-6 border-t border-line">
              <h2 className="text-sm font-semibold text-ink mb-2">Om {displayName}</h2>
              <p className="text-sm text-ink-secondary whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      </aside>

      <section className="flex-1">
        <h2 className="text-xl font-semibold text-ink mb-5">
          Aktive annonser <span className="text-ink-muted font-normal text-base">({listings.length})</span>
        </h2>

        {listings.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl p-16 text-center">
            <p className="text-ink-secondary">Ingen aktive annonser.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {listings.map((listing) => (
              <div
                key={listing.id}
                onClick={() => router.push(`/listings/${listing.id}`)}
                className="group cursor-pointer rounded-2xl overflow-hidden border border-line bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-44 w-full overflow-hidden bg-subtle">
                  {listing.images && listing.images.length > 0 ? (
                    <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-ink-muted">Ingen bilde</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium truncate text-ink">{listing.title}</h3>
                  <p className="font-semibold mt-1 text-lg text-ink">
                    {(listing.price_ore / 100).toLocaleString("nb-NO")} kr
                  </p>
                  <p className="text-sm mt-1 text-ink-secondary">{listing.municipality}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {isOwn && favorites.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-ink mb-5">Likte annonser</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {favorites.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => router.push(`/listings/${listing.id}`)}
                  className="group cursor-pointer rounded-2xl overflow-hidden border border-line bg-surface shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="h-40 w-full overflow-hidden bg-subtle">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm text-ink-muted">Ingen bilde</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium truncate text-ink">{listing.title}</h3>
                    <p className="font-semibold mt-1 text-lg text-ink">
                      {(listing.price_ore / 100).toLocaleString("nb-NO")} kr
                    </p>
                    <p className="text-sm mt-1 text-ink-secondary">{listing.municipality}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-xl font-semibold text-ink mb-5">
            Vurderinger <span className="text-ink-muted font-normal text-base">({reviewCount})</span>
          </h2>

          {reviews.length === 0 ? (
            <div className="bg-surface border border-line rounded-2xl p-10 text-center">
              <p className="text-ink-secondary">Ingen vurderinger ennå.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => {
                const avg = (r.communication + r.reliability + r.as_described) / 3;
                const reviewer = r.reviewer_display_name || r.reviewer_name;
                return (
                  <div key={r.id} className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-brand-lightest text-brand flex items-center justify-center font-bold shrink-0">
                          {reviewer.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-ink">{reviewer}</p>
                          <p className="text-xs text-ink-muted">
                            {r.listing_title} ·{" "}
                            {new Date(r.created_at).toLocaleDateString("nb-NO", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating value={Math.round(avg)} readOnly size="sm" />
                        <span className="font-semibold text-ink text-sm">{avg.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center justify-between sm:block">
                        <span className="text-ink-secondary">Kommunikasjon</span>
                        <StarRating value={r.communication} readOnly size="sm" />
                      </div>
                      <div className="flex items-center justify-between sm:block">
                        <span className="text-ink-secondary">Pålitelighet</span>
                        <StarRating value={r.reliability} readOnly size="sm" />
                      </div>
                      <div className="flex items-center justify-between sm:block">
                        <span className="text-ink-secondary">Som beskrevet</span>
                        <StarRating value={r.as_described} readOnly size="sm" />
                      </div>
                    </div>

                    {r.comment && (
                      <p className="mt-4 pt-4 border-t border-line text-ink whitespace-pre-wrap">{r.comment}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}