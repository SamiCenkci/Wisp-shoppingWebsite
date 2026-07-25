"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

export default function ThemeToggle() {
  const { t } = useLanguage();
  const [dark, setDark] = useState(false);

  // On mount, read saved preference (or system default)
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <button
      onClick={toggle}
      aria-label={t("nav.toggleTheme")}
      className="shrink-0 w-10 h-10 rounded-lg border border-line text-ink flex items-center justify-center text-lg hover:bg-subtle"
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}