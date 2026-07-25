"use client";

import ThemeToggle from "@/components/ThemeToggle";
import LanguageToggle from "@/components/LanguageToggle";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="max-w-[1400px] mx-auto px-[5%] py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="font-bold text-brand text-lg tracking-tight">Wisp</span>
            <p className="text-sm text-ink-secondary mt-1">{t("nav.tagline")}</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-ink-secondary">
            <Link href="/om-oss" className="hover:text-brand">{t("nav.aboutUs")}</Link>
            <Link href="/hjelp" className="hover:text-brand">{t("nav.help")}</Link>
            <Link href="/personvern" className="hover:text-brand">{t("nav.privacy")}</Link>
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
        <div className="border-t border-line mt-8 pt-6 text-xs text-ink-muted text-center">
          © {new Date().getFullYear()} Wisp
        </div>
      </div>
    </footer>
  );
}
