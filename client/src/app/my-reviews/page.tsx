"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StarRating from "@/components/StarRating";
import ConfirmDialog from "@/components/ConfirmDialog";

type Review = {
  id: string;
  listing_id: string;
  listing_title: string;
  communication: number;
  reliability: number;
  as_described: number;
  comment: string;
  reply: string;
  created_at: string;
  reviewer_name?: string;
  reviewer_display_name?: string;
  reviewed_name?: string;
  reviewed_display_name?: string;
};

export default function MyReviewsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"received" | "given">("received");
  const [received, setReceived] = useState<Review[]>([]);
  const [given, setGiven] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  function loadAll() {
    const stored = localStorage.getItem("user");
    let myId = "";
    try {
      myId = stored ? JSON.parse(stored).id : "";
    } catch {}
    if (!myId) {
      router.push("/login");
      return;
    }

    Promise.all([
      api(`/api/users/${myId}/reviews`).then((d) => d.reviews ?? []).catch(() => []),
      api("/api/reviews/given").catch(() => []),
    ])
      .then(([rec, giv]) => {
        setReceived(rec ?? []);
        setGiven(giv ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function submitReply(reviewId: string) {
    if (!replyText.trim()) return;
    setError("");
    try {
      await api(`/api/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply: replyText }),
      });
      setReplyingTo(null);
      setReplyText("");
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre svar");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    setError("");
    try {
      await api(`/api/reviews/${id}`, { method: "DELETE" });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke slette");
    }
  }

  const list = tab === "received" ? received : given;

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-bold text-ink mb-6">Vurderinger</h1>

      <div className="flex gap-2 mb-6 border-b border-line">
        <button
          onClick={() => setTab("received")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "received" ? "border-brand text-brand" : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Vurderinger fått ({received.length})
        </button>
        <button
          onClick={() => setTab("given")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "given" ? "border-brand text-brand" : "border-transparent text-ink-secondary hover:text-ink"
          }`}
        >
          Vurderinger gitt ({given.length})
        </button>
      </div>

      {loading ? (
        <p className="text-ink-secondary">Laster...</p>
      ) : list.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center">
          <p className="text-ink-secondary">
            {tab === "received" ? "Du har ikke fått noen vurderinger ennå." : "Du har ikke gitt noen vurderinger ennå."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((r) => {
            const avg = (r.communication + r.reliability + r.as_described) / 3;
            const other =
              tab === "received"
                ? r.reviewer_display_name || r.reviewer_name || "Bruker"
                : r.reviewed_display_name || r.reviewed_name || "Bruker";

            return (
              <div key={r.id} className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-full bg-brand-lightest text-brand flex items-center justify-center font-bold shrink-0">
                      {other.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-medium text-ink">
                        {tab === "received" ? `Fra ${other}` : `Til ${other}`}
                      </p>
                      <button
                        onClick={() => router.push(`/listings/${r.listing_id}`)}
                        className="text-xs text-ink-muted hover:text-brand"
                      >
                        {r.listing_title} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("nb-NO", { year: "numeric", month: "short", day: "numeric" })}
                      </button>
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

                {r.reply && (
                  <div className="mt-4 ml-4 pl-4 border-l-2 border-brand">
                    <p className="text-xs font-semibold text-brand mb-1">Svar</p>
                    <p className="text-ink whitespace-pre-wrap">{r.reply}</p>
                  </div>
                )}

                {/* Reply — only on reviews about you, and only once */}
                {tab === "received" && !r.reply && (
                  <div className="mt-4 pt-4 border-t border-line">
                    {replyingTo === r.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          placeholder="Skriv et svar..."
                          className="w-full border border-line rounded-xl px-3 py-2 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReply(r.id)}
                            className="px-4 py-2 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-dark"
                          >
                            Send svar
                          </button>
                          <button
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                            className="px-4 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:text-ink"
                          >
                            Avbryt
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setReplyingTo(r.id);
                          setReplyText("");
                        }}
                        className="text-sm text-brand font-medium hover:text-brand-dark"
                      >
                        Svar på vurderingen
                      </button>
                    )}
                  </div>
                )}

                {/* Delete — only on reviews you wrote */}
                {tab === "given" && (
                  <div className="mt-4 pt-4 border-t border-line">
                    <button
                      onClick={() => setDeleteTarget(r.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Slett vurdering
                    </button>
                    {error && (
                      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Slette vurderingen?"
        message="Vurderingen blir borte for godt."
        confirmLabel="Slett"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}