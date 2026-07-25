"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { expiryLabel } from "@/lib/expiry";
import { useLanguage } from "@/lib/i18n";
import dynamic from "next/dynamic";
import { ATTRIBUTE_LABELS } from "@/lib/categories";

const ListingMap = dynamic(() => import("@/components/ListingMap"), { ssr: false });

// Norwegian display labels for the canonical condition codes from the API;
// wrapped in tc() at render time for English display.
const conditionLabels: Record<string, string> = {
  new: "Ny",
  like_new: "Som ny",
  good: "God",
  fair: "Brukbar",
};

// The `value` is the Norwegian code sent to the API and must stay unchanged;
// only the label shown in the dropdown is translated.
const reportReasons = [
  { value: "svindel", labelKey: "listing.reasonFraud" },
  { value: "upassende", labelKey: "listing.reasonInappropriate" },
  { value: "feil_kategori", labelKey: "listing.reasonWrongCategory" },
  { value: "duplikat", labelKey: "listing.reasonDuplicate" },
  { value: "solgt", labelKey: "listing.reasonAlreadySold" },
  { value: "annet", labelKey: "listing.reasonOther" },
];

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
  const { t, tc } = useLanguage();
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
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportMsg, setReportMsg] = useState("");
  const [reporting, setReporting] = useState(false);

  function loadListing() {
    return api(`/api/listings/${params.id}`).then((data) => {
      setListing(data.listing);
      setImages(data.images ?? []);
      setSimilar(data.similar ?? []);
      setSeller(data.seller ?? null);
      setLikeCount(data.like_count ?? 0);
      setLiked(data.liked_by_me ?? false);
      setAttributes(data.attributes && typeof data.attributes === "object" ? data.attributes : {});
      const stored = localStorage.getItem("user");
      if (stored && data.seller) {
        try {
          const me = JSON.parse(stored);
          setIsOwn(me.id === data.seller.id);
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

  // Ask the backend whether a review is still possible, so the button
  // disappears once this user has already reviewed.
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
      alert(err instanceof Error ? err.message : t("listing.couldNotMarkSold"));
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
      setLiked(data.liked_by_me ?? false);
    } catch (err) {
      alert(err instanceof Error ? err.message : t("listing.couldNotUpdate"));
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
      alert(err instanceof Error ? err.message : t("listing.couldNotStartConversation"));
    }
  }

  async function submitReport() {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    if (!reportReason) {
      setReportMsg(t("listing.chooseReason"));
      return;
    }
    setReporting(true);
    setReportMsg("");
    try {
      await api(`/api/listings/${params.id}/report`, {
        method: "POST",
        body: JSON.stringify({ reason: reportReason, details: reportDetails }),
      });
      setReportMsg(t("listing.reportReceived"));
      setTimeout(() => setReportOpen(false), 1500);
    } catch (err) {
      setReportMsg(err instanceof Error ? err.message : t("listing.couldNotSendReport"));
    } finally {
      setReporting(false);
    }
  }

  if (loading) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-ink-secondary">{t("common.loading")}</p>;
  if (error) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-red-600">{error}</p>;
  if (!listing) return <p className="max-w-3xl mx-auto px-[5%] py-10">{t("listing.notFound")}</p>;

  if (listing.deleted_at) {
    return (
      <main className="max-w-2xl mx-auto px-[5%] py-16 text-center">
        <div className="text-5xl mb-4">🗑️</div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("listing.deletedTitle")}</h1>
        <p className="text-ink-secondary mb-8">
          {t("listing.deletedBody", { title: listing.title })}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark"
          >
            {t("listing.browseOtherListings")}
          </button>
          <button
            onClick={() => router.push("/chat")}
            className="px-5 py-2.5 rounded-xl border border-line text-ink-secondary font-medium hover:border-brand hover:text-brand"
          >
            {t("listing.goToMessages")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-[1100px] mx-auto px-[5%] py-8">
      <button onClick={() => router.push("/")} className="text-brand text-sm mb-4 hover:underline">
        {t("listing.backToListings")}
      </button>
      {listing.status !== "active" && (
        <div className="mb-4 rounded-xl bg-subtle border border-line px-4 py-3 text-sm text-ink-secondary">
          {listing.status === "sold"
            ? t("listing.soldBanner")
            : t("listing.expiredBanner")}
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
              {t("listing.noImage")}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-24 self-start">
          <h1 className="text-3xl font-bold text-ink">{listing.title}</h1>
          <p className="text-3xl text-brand font-bold mt-3">
            {listing.ad_type === "giveaway" ? t("listing.free") : `${(listing.price_ore / 100).toLocaleString("nb-NO")} kr`}
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
            <span>{t("listing.likes", { n: likeCount })}</span>
          </button>

          <div className="flex flex-wrap gap-2 mt-4 text-sm">
            <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{tc(listing.category)}</span>
            {listing.sub_category && (
              <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{tc(listing.sub_category)}</span>
            )}
            {listing.product_category && (
              <span className="bg-brand-lightest text-brand rounded-full px-3 py-1">{tc(listing.product_category)}</span>
            )}
            <span className="bg-subtle text-ink-secondary rounded-full px-3 py-1">
              {tc(conditionLabels[listing.condition] ?? listing.condition)}
            </span>
          </div>

          {Object.keys(attributes).length > 0 && (
            <dl className="mt-5 border border-line rounded-xl divide-y divide-line text-sm">
              {Object.entries(attributes).map(([key, value]) =>
                value ? (
                  <div key={key} className="flex justify-between px-4 py-2.5">
                    <dt className="text-ink-secondary">{tc(ATTRIBUTE_LABELS[key] ?? key)}</dt>
                    <dd className="text-ink font-medium">{tc(value)}</dd>
                  </div>
                ) : null
              )}
            </dl>
          )}

          <p className="mt-5 text-ink whitespace-pre-wrap">{listing.description}</p>

          <div className="mt-5 pt-5 border-t border-line text-sm text-ink-secondary space-y-1">
            <p>📍 {listing.municipality}, {listing.county}</p>
            <p>⏱ {expiryLabel(listing.created_at, t)}</p>
            <p>👁 {t("listing.views", { n: listing.view_count ?? 0 })}</p>
          </div>

          {listing.latitude && listing.longitude ? (
            <div className="mt-5">
              <p className="text-sm font-medium text-ink mb-2">{t("listing.approximateArea")}</p>
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
                {t("listing.ownListing")}
              </div>
              {listing.status !== "sold" && (
                <button
                  onClick={openSoldModal}
                  className="w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark"
                >
                  {t("listing.markAsSold")}
                </button>
              )}
              <button
                onClick={() => router.push(`/edit/${listing.id}`)}
                className="w-full border border-line text-ink-secondary rounded-lg py-3 font-medium hover:border-brand hover:text-brand"
              >
                {t("listing.editListing")}
              </button>
            </div>
          ) : (
            <button
              onClick={startConversation}
              className="mt-6 w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark"
            >
              {t("listing.messageSeller")}
            </button>
          )}

          {canReview && (
            <button
              onClick={() => router.push(`/review/${listing.id}`)}
              className="mt-3 w-full bg-brand text-white rounded-lg py-3 font-medium hover:bg-brand-dark"
            >
              {t("listing.leaveReview")}
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
                  {t("listing.memberSince", {
                    date: new Date(seller.created_at).toLocaleDateString("nb-NO", { year: "numeric", month: "long" }),
                  })}
                </p>
              </div>
              <span className="text-brand text-sm">{t("listing.viewProfile")}</span>
            </div>
          )}

          {!isOwn && (
            <button
              onClick={() => setReportOpen(true)}
              className="mt-4 w-full text-sm text-ink-muted hover:text-red-600 underline"
            >
              🚩 {t("listing.reportListing")}
            </button>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ink mb-5">{t("listing.similarListings")}</h2>
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
                    <div className="w-full h-full flex items-center justify-center text-xs text-ink-muted">{t("listing.noImage")}</div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm truncate text-ink">{s.title}</h3>
                  <p className="font-semibold text-ink mt-0.5">
                    {s.ad_type === "giveaway" ? t("listing.free") : `${(s.price_ore / 100).toLocaleString("nb-NO")} kr`}
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
            <h2 className="text-lg font-semibold text-ink mb-1">{t("listing.whoDidYouSellTo")}</h2>
            <p className="text-sm text-ink-secondary mb-5">{listing.title}</p>

            {loadingBuyers ? (
              <p className="text-ink-secondary text-sm py-4">{t("common.loading")}</p>
            ) : buyers.length === 0 ? (
              <p className="text-ink-secondary text-sm py-4">
                {t("listing.noBuyers")}
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
              {t("common.cancel")}
            </button>
          </div>
        </div>
      )}

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setReportOpen(false)}
        >
          <div
            className="bg-surface border border-line rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-ink mb-1">{t("listing.reportListing")}</h2>
            <p className="text-sm text-ink-secondary mb-5">
              {t("listing.reportIntro")}
            </p>

            <label className="block text-sm font-medium text-ink mb-1.5">{t("listing.reason")}</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 bg-surface outline-none focus:border-brand mb-4"
            >
              <option value="">{t("listing.chooseReasonPlaceholder")}</option>
              {reportReasons.map((r) => (
                <option key={r.value} value={r.value}>{t(r.labelKey)}</option>
              ))}
            </select>

            <label className="block text-sm font-medium text-ink mb-1.5">{t("listing.detailsOptional")}</label>
            <textarea
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
              rows={3}
              maxLength={1000}
              className="w-full border border-line rounded-xl px-3.5 py-2.5 bg-surface outline-none focus:border-brand"
              placeholder={t("listing.detailsPlaceholder")}
            />

            {reportMsg && <p className="text-sm text-ink-secondary mt-3">{reportMsg}</p>}

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setReportOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-line text-ink-secondary font-medium hover:text-ink"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submitReport}
                disabled={reporting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {reporting ? t("common.sending") : t("listing.sendReport")}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}