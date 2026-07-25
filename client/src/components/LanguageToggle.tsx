"use client";

import { useLanguage } from "@/lib/i18n";

// Small NO/EN switcher, styled like ThemeToggle.
export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "no" ? "en" : "no")}
      aria-label={t("nav.toggleLanguage")}
      className="shrink-0 h-10 px-2.5 rounded-lg border border-line text-ink flex items-center justify-center gap-1 text-sm font-medium hover:bg-subtle"
    >
      <span aria-hidden>🌐</span>
      {lang === "no" ? "NO" : "EN"}
    </button>
  );
}
