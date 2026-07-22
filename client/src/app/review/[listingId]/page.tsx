"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import StarRating from "@/components/StarRating";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [communication, setCommunication] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [asDescribed, setAsDescribed] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const average =
    communication && reliability && asDescribed
      ? ((communication + reliability + asDescribed) / 3).toFixed(1)
      : null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!communication || !reliability || !asDescribed) {
      setError("Gi en vurdering på alle tre punktene.");
      return;
    }
    setLoading(true);
    try {
      await api("/api/reviews", {
        method: "POST",
        body: JSON.stringify({
          listing_id: params.listingId,
          communication,
          reliability,
          as_described: asDescribed,
          comment,
        }),
      });
      router.push("/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke sende vurdering");
    } finally {
      setLoading(false);
    }
  }

  const rows = [
    { label: "Kommunikasjon", hint: "Var det lett å kommunisere?", value: communication, set: setCommunication },
    { label: "Pålitelighet", hint: "Holdt personen avtalen?", value: reliability, set: setReliability },
    { label: "Som beskrevet", hint: "Stemte varen med beskrivelsen?", value: asDescribed, set: setAsDescribed },
  ];

  return (
    <main className="max-w-2xl mx-auto px-[5%] py-10">
      <h1 className="text-2xl font-bold text-ink mb-2">Gi en vurdering</h1>
      <p className="text-ink-secondary mb-8">Hvordan gikk handelen? Vurderingen din hjelper andre brukere.</p>

      <form onSubmit={submit} className="bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-ink">{row.label}</p>
              <p className="text-sm text-ink-secondary">{row.hint}</p>
            </div>
            <StarRating value={row.value} onChange={row.set} />
          </div>
        ))}

        {average && (
          <div className="border-t border-line pt-4 flex items-center justify-between">
            <span className="font-medium text-ink">Samlet vurdering</span>
            <span className="text-2xl font-bold text-brand">{average} / 5</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Kommentar (valgfritt)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Skriv gjerne noen ord om handelen..."
            className="w-full border border-line rounded-xl px-4 py-2.5 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand text-white rounded-xl py-3 font-medium hover:bg-brand-dark disabled:opacity-50"
        >
          {loading ? "Sender..." : "Send vurdering"}
        </button>
      </form>
    </main>
  );
}