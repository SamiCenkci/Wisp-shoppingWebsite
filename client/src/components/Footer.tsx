import ThemeToggle from "@/components/ThemeToggle";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface mt-16">
      <div className="max-w-[1400px] mx-auto px-[5%] py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 text-center sm:text-left">
          <div>
            <span className="font-bold text-brand text-lg tracking-tight">Wisp</span>
            <p className="text-sm text-ink-secondary mt-1">Kjøp og selg brukte ting, enkelt og trygt.</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-sm text-ink-secondary">
            <Link href="/om-oss" className="hover:text-brand">Om oss</Link>
            <Link href="/hjelp" className="hover:text-brand">Hjelp</Link>
            <Link href="/personvern" className="hover:text-brand">Personvern</Link>
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