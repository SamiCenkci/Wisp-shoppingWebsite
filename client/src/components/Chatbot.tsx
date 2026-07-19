"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { from: "bot" | "user"; text: string };

// Keyword-matched answers. Each entry: keywords to match + the answer.
const KNOWLEDGE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["legge ut", "ny annonse", "selge", "publisere", "poste", "legge til"],
    answer:
      "For å legge ut en annonse: logg inn, klikk «+ Ny annonse», fyll ut tittel, beskrivelse og pris, og last opp bilder. Du kan velge om varen selges eller gis bort gratis.",
  },
  {
    keywords: ["kontakt", "melding", "chat", "selger", "snakke", "kjøper"],
    answer:
      "Åpne annonsen og klikk «Send melding til selger» for å starte en samtale. Du finner alle samtalene dine under «Meldinger».",
  },
  {
    keywords: ["gis bort", "gratis", "giveaway"],
    answer:
      "Noen annonser er gratis. Da står det «Gis bort» på annonsen, og prisen vises som «Gratis».",
  },
  {
    keywords: ["hvor lenge", "utløper", "aktiv", "60", "slette", "solgt"],
    answer:
      "Annonser er aktive i 60 dager. Du kan når som helst markere en annonse som solgt eller slette den under «Mine annonser».",
  },
  {
    keywords: ["favoritt", "hjerte", "lagre", "likte", "liker"],
    answer:
      "Trykk på hjertet på en annonse for å lagre den. Du finner alle lagrede annonser på profilen din under «Likte annonser».",
  },
  {
    keywords: ["trygt", "sikkerhet", "svindel", "betale", "møte"],
    answer:
      "Møt gjerne selgeren på et offentlig sted, sjekk varen før du betaler, og vær forsiktig med forskuddsbetaling til ukjente. Bruk sunn fornuft.",
  },
  {
    keywords: ["søk", "finne", "filtrer", "lete"],
    answer:
      "Bruk søkefeltet øverst for å finne annonser. Etter et søk kan du filtrere på kategori, postnummer, pris, tilstand og type.",
  },
  {
    keywords: ["konto", "registrere", "logge inn", "passord", "profil"],
    answer:
      "Klikk «Registrer deg» for å lage en konto, eller «Logg inn» hvis du allerede har en. Du kan redigere profilen din når som helst.",
  },
  {
    keywords: ["mørk", "lyst", "tema", "dark", "mode"],
    answer:
      "Du kan bytte mellom lyst og mørkt tema med tema-knappen nederst på siden.",
  },
];

const SUGGESTIONS = [
  "Hvordan legger jeg ut en annonse?",
  "Hvordan kontakter jeg en selger?",
  "Hva betyr «Gis bort»?",
  "Er det trygt å handle her?",
];

function findAnswer(input: string): string {
  const text = input.toLowerCase();
  for (const entry of KNOWLEDGE) {
    if (entry.keywords.some((k) => text.includes(k))) {
      return entry.answer;
    }
  }
  return "Beklager, det er jeg ikke sikker på. Prøv å spørre om hvordan du legger ut en annonse, kontakter en selger, eller lagrer favoritter. Du finner mer på Hjelp-siden.";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hei! 👋 Jeg er Wisp-hjelperen. Hva lurer du på?" },
  ]);
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
    // Small delay so it feels like it's "thinking"
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: findAnswer(q) }]);
    }, 350);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-brand text-white shadow-lg flex items-center justify-center text-2xl hover:bg-brand-dark transition-transform hover:scale-105"
        aria-label="Åpne hjelp"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[500px] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-brand text-white px-4 py-3 font-semibold shrink-0">
            Wisp-hjelperen
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

            {/* Suggested questions (only show at start) */}
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