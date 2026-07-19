"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { from: "bot" | "user"; text: string };

// Each entry: trigger keywords + the answer. Matching is case-insensitive
// and checks if any keyword appears anywhere in the user's message.
const KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["legg", "legge", "legger", "ny annonse", "selge", "selg", "publiser", "poste", "post", "opprett", "lage annonse", "hvordan selger"],
    answer:
      "For å legge ut en annonse: logg inn, klikk «+ Ny annonse» øverst, fyll ut tittel, beskrivelse og pris, og last opp bilder. Du kan velge om varen selges eller gis bort gratis. 📸",
  },
  {
    keywords: ["kontakt", "melding", "meldinger", "chat", "chatte", "selger", "snakke", "kjøper", "kontakte", "svar"],
    answer:
      "Åpne annonsen du er interessert i og klikk «Send melding til selger». Da starter en samtale som du finner igjen under «Meldinger» i menyen. 💬",
  },
  {
    keywords: ["gis bort", "gratis", "giveaway", "gi bort", "gi vekk", "free"],
    answer:
      "Noen annonser gis bort gratis. Da står det «Gis bort» på annonsen, og prisen vises som «Gratis». Du kan selv velge dette når du lager en annonse.",
  },
  {
    keywords: ["hvor lenge", "utløper", "utløp", "aktiv", "60", "varighet", "hvor lang tid"],
    answer:
      "Annonser er aktive i 60 dager. Etter det utløper de automatisk, men du kan alltid legge dem ut på nytt.",
  },
  {
    keywords: ["slette", "slett", "fjerne", "fjern", "solgt", "marker"],
    answer:
      "Du kan slette en annonse eller markere den som solgt under «Mine annonser». Klikk på ⋮-menyen på annonsen for å velge.",
  },
  {
    keywords: ["favoritt", "favoritter", "hjerte", "lagre", "likte", "liker", "lik", "spare"],
    answer:
      "Trykk på hjertet ❤️ på en annonse for å lagre den som favoritt. Du finner alle lagrede annonser på profilen din under «Likte annonser».",
  },
  {
    keywords: ["trygt", "trygg", "sikkerhet", "sikker", "svindel", "svindler", "betale", "betaling", "møte", "møtes", "lure"],
    answer:
      "For trygg handel: møt selgeren på et offentlig sted, sjekk varen før du betaler, og vær forsiktig med forskuddsbetaling til ukjente. Bruk sunn fornuft, som ved all annen brukthandel. 🔒",
  },
  {
    keywords: ["søk", "søke", "finne", "finn", "filtrer", "filter", "lete", "leter", "kategori"],
    answer:
      "Bruk søkefeltet øverst for å finne annonser. Etter et søk kan du filtrere på kategori, postnummer, pris, tilstand og type annonse. 🔍",
  },
  {
    keywords: ["konto", "registrer", "registrere", "logge inn", "logg inn", "innlogging", "profil", "bruker"],
    answer:
      "Klikk «Registrer deg» for å lage en konto, eller «Logg inn» hvis du allerede har en. Du kan redigere profilen din når som helst fra «Min profil».",
  },
  {
    keywords: ["passord", "glemt", "endre passord", "resette"],
    answer:
      "Passordet ditt lagres kryptert og trygt. Har du problemer med innlogging, dobbeltsjekk e-postadressen og passordet du bruker.",
  },
  {
    keywords: ["mørk", "lyst", "tema", "dark", "light", "mode", "farge", "natt"],
    answer:
      "Du kan bytte mellom lyst og mørkt tema med tema-knappen (🌙/☀️) nederst på siden.",
  },
  {
    keywords: ["bilde", "bilder", "bilde opp", "last opp", "laste opp", "foto", "bildene"],
    answer:
      "Når du lager en annonse kan du laste opp flere bilder. Gode, tydelige bilder gjør at annonsen selger raskere! 📷",
  },
  {
    keywords: ["pris", "koste", "kostnad", "gebyr", "avgift", "betale for"],
    answer:
      "Det er gratis å bruke Wisp – både å legge ut annonser og å bla gjennom. Du bestemmer selv prisen på det du selger.",
  },
  {
    keywords: ["endre", "redigere", "rediger", "oppdatere", "endre annonse"],
    answer:
      "Du kan redigere en annonse under «Mine annonser» – klikk på ⋮-menyen og velg «Endre».",
  },
  {
    keywords: ["kategori", "kategorier", "type", "hva kan"],
    answer:
      "Du finner annonser i mange kategorier øverst på forsiden. Klikk på en kategori for å se alt innenfor den.",
  },
  {
    keywords: ["hei", "hallo", "heisann", "hjelp", "hjelpe", "spørsmål"],
    answer:
      "Hei! Jeg hjelper deg gjerne. Du kan spørre om hvordan du legger ut en annonse, kontakter en selger, lagrer favoritter, søker, eller handler trygt. 😊",
  },
  {
    keywords: ["takk", "tusen takk", "flott", "supert", "bra"],
    answer:
      "Bare hyggelig! 😊 Si fra hvis det er noe mer du lurer på.",
  },
];

const SUGGESTIONS = [
  "Hvordan legger jeg ut en annonse?",
  "Hvordan kontakter jeg en selger?",
  "Hva betyr «Gis bort»?",
  "Hvordan lagrer jeg favoritter?",
  "Er det trygt å handle her?",
  "Koster det noe å bruke Wisp?",
];

function findAnswer(input: string): string {
  const text = input.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return entry.answer;
    }
  }
  return "Beklager, det er jeg ikke sikker på. 🤔 Prøv å spørre om annonser, meldinger, favoritter, søk eller trygg handel – eller se Hjelp-siden for mer.";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const WELCOME: Msg = { from: "bot", text: "Hei! 👋 Jeg er Wisp-hjelperen. Hva lurer du på?" };
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);

  // Load saved history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wispChatHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {}
  }, []);

  // Save history whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem("wispChatHistory", JSON.stringify(messages));
    } catch {}
  }, [messages]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  function ask(question: string) {
    const q = question.trim();
    if (!q) return;
    setMessages((prev) => [...prev, { from: "user", text: q }]);
    setInput("");
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: findAnswer(q) }]);
    }, 350);
  }

  function reset() {
    setMessages([WELCOME]);
    setInput("");
    try {
      localStorage.removeItem("wispChatHistory");
    } catch {}
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center text-2xl hover:bg-brand-dark transition-transform hover:scale-105"
        aria-label="Åpne hjelp"
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[500px] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-brand text-white px-4 py-3 font-semibold shrink-0 flex items-center justify-between">
            <span>Wisp-hjelperen</span>
            {messages.length > 1 && (
              <button
                onClick={reset}
                className="text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1"
              >
                ← Tilbake
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.from === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                    m.from === "user"
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-subtle text-ink rounded-bl-sm"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {messages.length <= 1 && (
              <div className="space-y-2 pt-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="block w-full text-left text-sm px-3 py-2 rounded-xl border border-line text-ink-secondary hover:border-brand hover:text-brand"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="border-t border-line p-3 flex gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv et spørsmål..."
              className="flex-1 px-3 py-2 rounded-xl border border-line bg-subtle text-ink outline-none focus:bg-surface focus:border-brand text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark text-sm"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}