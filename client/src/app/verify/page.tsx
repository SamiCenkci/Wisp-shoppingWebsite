"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

function VerifyInner() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage(t("auth.tokenMissing"));
      return;
    }

    api(`/api/auth/verify?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus("ok");
        // Reflect the new state locally so the banner disappears.
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const me = JSON.parse(stored);
            localStorage.setItem("user", JSON.stringify({ ...me, verified: true }));
          }
        } catch {}
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : t("auth.verifyFailed"));
      });
  }, [searchParams]);

  return (
    <main className="max-w-md mx-auto px-[5%] py-20 text-center">
      {status === "loading" && <p className="text-ink-secondary">{t("auth.verifying")}</p>}

      {status === "ok" && (
        <>
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-ink mb-2">{t("auth.emailVerified")}</h1>
          <p className="text-ink-secondary mb-8">
            {t("auth.verifiedInfo")}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark"
          >
            {t("auth.toFrontPage")}
          </button>
        </>
      )}

      {status === "error" && (
        <>
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-ink mb-2">{t("auth.couldNotVerify")}</h1>
          <p className="text-ink-secondary mb-8">{message}</p>
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl border border-line text-ink-secondary font-medium hover:border-brand hover:text-brand"
          >
            {t("auth.toFrontPage")}
          </button>
        </>
      )}
    </main>
  );
}

export default function VerifyPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<main className="max-w-md mx-auto px-[5%] py-20 text-center text-ink-secondary">{t("common.loading")}</main>}>
      <VerifyInner />
    </Suspense>
  );
}