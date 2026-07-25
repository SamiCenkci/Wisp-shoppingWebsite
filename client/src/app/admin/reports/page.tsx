"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import ConfirmDialog from "@/components/ConfirmDialog";


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

// Maps API reason codes to display-label keys. The codes themselves are
// identifiers and must not change.
const reasonKeys: Record<string, string> = {
  svindel: "admin.reasonSvindel",
  upassende: "admin.reasonUpassende",
  feil_kategori: "admin.reasonFeilKategori",
  duplikat: "admin.reasonDuplikat",
  solgt: "admin.reasonSolgt",
  annet: "admin.reasonAnnet",
};

const statusStyles: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  reviewed: "bg-brand-lightest text-brand border-brand",
  dismissed: "bg-subtle text-ink-muted border-line",
};

// Maps API status values to display-label keys. The values themselves are
// identifiers and must not change.
const statusKeys: Record<string, string> = {
  open: "admin.statusOpen",
  reviewed: "admin.statusReviewed",
  dismissed: "admin.statusDismissed",
};

export default function AdminReportsPage() {
  const { t } = useLanguage();
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

    const [removeTarget, setRemoveTarget] = useState<{ listingId: string; reportId: string; title: string } | null>(null);
    const [error, setError] = useState("");

 async function setStatus(id: string, status: string) {
    setError("");
    try {
      await api(`/api/admin/reports/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    const { listingId, reportId } = removeTarget;
    setRemoveTarget(null);
    setError("");
    try {
      await api(`/api/admin/listings/${listingId}`, { method: "DELETE" });
      await api(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "reviewed" }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.removeFailed"));
    }
  }

  if (loading) return <p className="max-w-3xl mx-auto px-[5%] py-10 text-ink-secondary">{t("common.loading")}</p>;

  if (denied) {
    return (
      <main className="max-w-md mx-auto px-[5%] py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-ink mb-2">{t("admin.noAccess")}</h1>
        <p className="text-ink-secondary">{t("admin.moderatorsOnly")}</p>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">{t("admin.title")}</h1>
      <p className="text-ink-secondary mb-6">
        {openCount === 1
          ? t("admin.openReportsOne", { count: openCount })
          : t("admin.openReportsMany", { count: openCount })}
      </p>

      {reports.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-12 text-center">
          <p className="text-ink-secondary">{t("admin.noReports")}</p>
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
                      {t("admin.reportedBy", { name: reporter })} ·{" "}
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
                    {statusKeys[r.status] ? t(statusKeys[r.status]) : r.status}
                  </span>
                </div>

                <p className="mt-3 text-sm">
                  <span className="font-medium text-ink">{reasonKeys[r.reason] ? t(reasonKeys[r.reason]) : r.reason}</span>
                </p>
                {r.details && (
                  <p className="mt-1 text-sm text-ink-secondary whitespace-pre-wrap">{r.details}</p>
                )}

                {removed && (
                  <p className="mt-3 text-xs text-ink-muted">{t("admin.alreadyRemoved")}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
                  {r.status === "open" && (
                    <>
                      <button
                        onClick={() => setStatus(r.id, "dismissed")}
                        className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand"
                      >
                        {t("admin.dismiss")}
                      </button>
                      <button
                        onClick={() => setStatus(r.id, "reviewed")}
                        className="px-3.5 py-2 rounded-xl border border-line text-ink-secondary text-sm hover:border-brand hover:text-brand"
                      >
                        {t("admin.markReviewed")}
                      </button>
                      {!removed && (
                        <button
                          onClick={() => setRemoveTarget({ listingId: r.listing_id, reportId: r.id, title: r.listing_title })}
                          className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-sm hover:bg-red-700"
                        >
                          {t("admin.removeListing")}
                        </button>
                      )}
                    </>
                  )}
                  {r.status !== "open" && (
                    <button
                      onClick={() => setStatus(r.id, "open")}
                      className="text-sm text-ink-secondary hover:text-brand underline"
                    >
                      {t("admin.reopen")}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        open={Boolean(removeTarget)}
        title={t("admin.removeConfirmTitle")}
        message={removeTarget ? t("admin.removeConfirmMessage", { title: removeTarget.title }) : undefined}
        confirmLabel={t("admin.removeConfirmLabel")}
        danger
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </main>
  );
}