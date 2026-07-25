"use client";

// ---------------------------------------------------------------------------
// Language switching (Norwegian / English)
//
// Usage in a client component:
//   const { t, tc, lang, setLang } = useLanguage();
//   <button>{t("nav.login")}</button>
//   <span>{tc(listing.category)}</span>   // category term, display-only
//
// The choice persists in localStorage. The first render is always Norwegian
// (matching the server-rendered HTML, so hydration stays clean); the saved
// language applies right after mount.
// ---------------------------------------------------------------------------

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Lang } from "./translations";
import { categoryTermsEn } from "./translations/categoryTerms";

type I18n = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Look up "namespace.key", with optional {placeholder} values. */
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Display a category/attribute term (stored in Norwegian) in the current language. */
  tc: (term: string) => string;
};

const LanguageContext = createContext<I18n>({
  lang: "no",
  setLang: () => {},
  t: (key) => key,
  tc: (term) => term,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("no");

  useEffect(() => {
    const saved = localStorage.getItem("lang");
    if (saved === "no" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem("lang", next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dot = key.indexOf(".");
      const ns = dictionaries[key.slice(0, dot)];
      const rest = key.slice(dot + 1);
      let text = ns?.[lang][rest] ?? ns?.no[rest] ?? key;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [lang]
  );

  const tc = useCallback(
    (term: string) => (lang === "en" ? categoryTermsEn[term] ?? term : term),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tc }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
