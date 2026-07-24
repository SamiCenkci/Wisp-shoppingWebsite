"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

type Report = {
  id: string;
  listing_id: string;
  listing_title: string;
  listing_status: string;
  listing_deleted_at: string | null;
  reporter_name: string;
  reporter_display_name: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
};

const reasonLabels: Record<string, string> = {
  svindel: "Mistanke om svindel",
  upassende: "Upassende innhold",
  feil_kategori: "Feil kategori",
  duplikat: "Duplikat",
  solgt: "Allerede solgt",
  annet: "Annet",
};

const statusStyles: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  reviewed: "bg-brand-lightest text-brand border-brand",
  dismissed: "bg-subtle text-ink-muted border-line",
};

const statusLabels: Record<string, string> = {
  open: "Åpen",
  reviewed: "Behandlet",
  dismissed: "Avvist",
};

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  function load() {
    api("/api/admin/reports")
      .then((data) => {
        setReports(data.reports ?? []);
        setOpenCount(Number(data.open_count ?? 0));
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/login");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setStatus(id: string, status: string) {
    try {
      await api(`/api/admin/reports/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke oppdatere");
    }
  }

  async function removeListing(listingId: string, reportId: string) {
    if (!confirm("Fjerne denne annonsen?")) return;
    try {
      await api(`/api/admin/listings/${listingId}`, { method: "DELETE" });
      await api(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "reviewed" }),
      });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kunne ikke fjerne annonsen");
    }
  }

  if (loading) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-ink-secondary">Laster...</p>;

  if (denied) {
    return (
      <main className="max-w-md mx-auto px-[5%] py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-ink mb-2">Ingen tilgang</h1>
        <p className="text-ink-secondary">Denne siden er kun for moderatorer.</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Rapporterte annonser</h1>
      <p className="text-ink-secondary mb-6">
        {openCount} {openCount === 1 ? "åpen rapport" : "åpne rapporter"}
      </p>

      {reports.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center">
          <p className="text-ink-secondary">Ingen rapporter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => {
            const reporter = r.reporter_display_name || r.reporter_name;
            const removed = Boolean(r.listing_deleted_at);
            return (
              <div key={r.id} className="bg-surface border border-line rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <button
                      onClick={() => router.push(`/listings/${r.listing_id}`)}
                      className="font-semibold text-ink hover:text-brand text-left"
                    >
                      {r.listing_title}
                    </button>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Rapportert av {reporter} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("nb-NO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2.5 py-1 rounded-full border ${
                      statusStyles[r.status] ?? statusStyles.dismissed
                    }`}
                  >
                    {statusLabels[r.status] ?? r.status}
                  </span>
                </div>

                <p className="mt-3 text-sm">
                  <span className="font-medium text-ink">{reasonLabels[r.reason] ?? r.reason}</span>
                </p>
                {r.details && (
                  <p className="mt-1 text-sm text-ink-secondary whitespace-pre-wrap">{r.details}</p>
                )}

                {removed && (
                  <p className="mt-3 text-xs text-ink-muted">Annonsen er allerede fjernet.</p>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
                  {r.status === "open" && (
                    <>
                      <button
                        onClick={() => setStatus(r.id, "dismissed")}
                        className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand"
                      >
                        Avvis
                      </button>
                      <button
                        onClick={() => setStatus(r.id, "reviewed")}
                        className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand"
                      >
                        Marker behandlet
                      </button>
                      {!removed && (
                        <button
                          onClick={() => removeListing(r.listing_id, r.id)}
                          className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
                        >
                          Fjern annonsen
                        </button>
                      )}
                    </>
                  )}
                  {r.status !== "open" && (
                    <button
                      onClick={() => setStatus(r.id, "open")}
                      className="text-sm text-ink-secondary hover:text-brand underline"
                    >
                      Gjenåpne
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}