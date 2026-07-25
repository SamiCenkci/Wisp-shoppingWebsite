"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

export default function VerifyBanner() {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");
    if (!token || !stored) return;
    try {
      const me = JSON.parse(stored);
      // Older sessions have no `verified` field — don't nag those users.
      if (me.verified === false) setShow(true);
    } catch {}
  }, []);

  async function resend() {
    setSending(true);
    try {
      await api("/api/auth/resend-verification", { method: "POST" });
      setSent(true);
    } catch {
      setSent(true); // don't reveal whether the address exists
    } finally {
      setSending(false);
    }
  }

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-[1400px] mx-auto px-[5%] py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-amber-900">
          {t("nav.verifyPrompt")}
        </span>
        {sent ? (
          <span className="text-amber-900 font-medium">{t("nav.linkSent")}</span>
        ) : (
          <button
            onClick={resend}
            disabled={sending}
            className="font-medium text-amber-900 underline hover:no-underline disabled:opacity-50"
          >
            {sending ? t("common.sending") : t("nav.resendLink")}
          </button>
        )}
      </div>
    </div>
  );
}