"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/lib/api";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [unread, setUnread] = useState(0);
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
    const stored = localStorage.getItem("user");
    if (stored) {
      try {
        setUserId(JSON.parse(stored).id ?? "");
      } catch {}
    } else {
      setUserId("");
    }
    setMenuOpen(false);
  }, [pathname]);

  

  function loadUnread() {
    if (!localStorage.getItem("token")) {
      setUnread(0);
      return;
    }
    api("/api/messages/unread-count")
      .then((data) => setUnread(data.count ?? 0))
      .catch(() => {});
  }

  // Fetch unread count on mount and whenever the route changes
  useEffect(() => {
    loadUnread();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Real-time: listen for new messages and refresh the count
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/api/ws?token=${token}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "message") {
          loadUnread();
        }
      } catch {}
    };
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  function loadRecent() {
    try {
      const saved = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      if (Array.isArray(saved)) setRecent(saved);
    } catch {}
  }

  function clearRecent() {
    localStorage.removeItem("recentSearches");
    setRecent([]);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setLoggedIn(false);
    setUnread(0);
    router.push("/");
  }

  function go(path: string) {
    setMenuOpen(false);
    router.push(path);
  }

  function runSearch(term: string) {
    setQ(term);
    setShowRecent(false);
    router.push(`/?q=${encodeURIComponent(term)}`);
  }

  function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    runSearch(q);
  }

  const linkClass = "px-3 py-2 rounded-lg text-ink-secondary hover:text-ink hover:bg-subtle font-medium text-left";

  const badge =
    unread > 0 ? (
      <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold leading-none">
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="max-w-[1400px] mx-auto px-[5%] py-3.5 flex items-center gap-3">
        <button
          onClick={() => {
            setMenuOpen(false);
            router.push("/");
            router.refresh();
          }}
          className="text-2xl font-bold text-brand shrink-0 tracking-tight hover:text-brand-dark"
        >
          Wisp
        </button>

        {/* Search with recent-searches dropdown */}
        <form onSubmit={search} className="flex-1 min-w-0 max-w-xl relative">
          <div className="flex">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => {
                loadRecent();
                setShowRecent(true);
              }}
              onBlur={() => setTimeout(() => setShowRecent(false), 150)}
              placeholder="Søk..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-l-xl border border-line border-r-0 bg-subtle text-ink outline-none focus:bg-surface focus:border-brand text-sm"
            />
            <button type="submit" className="px-4 py-2.5 rounded-r-xl bg-brand text-white font-medium hover:bg-brand-dark text-sm shrink-0">
              Søk
            </button>
          </div>

          {showRecent && recent.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg py-2 z-50">
              <p className="px-4 py-1 text-xs font-semibold text-ink-muted">Mine siste søk</p>
              {recent.map((term) => (
                <button
                  key={term}
                  type="button"
                  onMouseDown={() => runSearch(term)}
                  className="w-full text-left px-4 py-2 text-sm text-ink hover:bg-subtle flex items-center gap-2"
                >
                  <span className="text-ink-muted">🔍</span>
                  {term}
                </button>
              ))}
              <div className="border-t border-line mt-1 pt-1">
                <button
                  type="button"
                  onMouseDown={clearRecent}
                  className="w-full text-left px-4 py-2 text-sm text-ink-secondary hover:bg-subtle hover:text-brand"
                >
                  Tøm søkeloggen
                </button>
              </div>
            </div>
          )}
        </form>

        {!isAuthPage && (
          <>
            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1 text-sm shrink-0">
              {loggedIn ? (
                <>
                  <button onClick={() => go(`/profile/${userId}`)} className={linkClass}>Min profil</button>
                  <button onClick={() => go("/my-listings")} className={linkClass}>Mine annonser</button>
                  <button onClick={() => go("/chat")} className={`${linkClass} inline-flex items-center`}>Meldinger{badge}</button>
                  <button onClick={() => go("/new")} className="ml-1 px-4 py-2 rounded-xl text-white font-medium bg-brand hover:bg-brand-dark shadow-sm shrink-0">+ Ny annonse</button>
                  <button onClick={logout} className={linkClass}>Logg ut</button>
                </>
              ) : (
                <>
                  <button onClick={() => go("/login")} className={linkClass}>Logg inn</button>
                  <button onClick={() => go("/signup")} className="ml-1 px-4 py-2 rounded-xl text-white font-medium bg-brand hover:bg-brand-dark shadow-sm shrink-0">Registrer</button>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden shrink-0 w-10 h-10 rounded-lg border border-line text-ink flex items-center justify-center text-xl relative"
              aria-label="Meny"
            >
              {menuOpen ? "✕" : "☰"}
              {!menuOpen && unread > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[11px] font-semibold leading-none">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          </>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {!isAuthPage && menuOpen && (
        <div className="md:hidden border-t border-line bg-surface px-[5%] py-3 flex flex-col gap-1">
          {loggedIn ? (
            <>
              <button onClick={() => go(`/profile/${userId}`)} className={linkClass}>Min profil</button>
              <button onClick={() => go("/my-listings")} className={linkClass}>Mine annonser</button>
              <button onClick={() => go("/chat")} className={`${linkClass} inline-flex items-center`}>Meldinger{badge}</button>
              <button onClick={() => go("/new")} className="px-3 py-2 rounded-lg text-white font-medium bg-brand hover:bg-brand-dark text-left">+ Ny annonse</button>
              <button onClick={logout} className={linkClass}>Logg ut</button>
            </>
          ) : (
            <>
              <button onClick={() => go("/login")} className={linkClass}>Logg inn</button>
              <button onClick={() => go("/signup")} className="px-3 py-2 rounded-lg text-white font-medium bg-brand hover:bg-brand-dark text-left">Registrer</button>
            </>
          )}
        </div>
      )}
    </header>
  );
}