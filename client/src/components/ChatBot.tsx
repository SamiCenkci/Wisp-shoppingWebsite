"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/lib/i18n";
import type { Lang } from "@/lib/translations";

type Msg = { from: "bot" | "user"; text: string };

// Each entry: trigger keywords + the answer. Matching is case-insensitive
// and checks if any keyword appears anywhere in the user's message.
// One knowledge base per language; the active language's base is used
// so keyword matching works for both Norwegian and English questions.
const KNOWLEDGE: Record<Lang, { keywords: string[]; answer: string }[]> = {
  no: [
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
  ],
  en: [
    {
      keywords: ["post a listing", "post an ad", "new listing", "create a listing", "sell", "selling", "publish", "list an item", "how do i post", "put up"],
      answer:
        "To post a listing: log in, click \"+ New listing\" at the top, fill in a title, description and price, and upload photos. You can choose whether the item is for sale or given away for free. 📸",
    },
    {
      keywords: ["contact", "message", "messages", "chat", "seller", "talk to", "buyer", "reply", "get in touch"],
      answer:
        "Open the listing you're interested in and click \"Send message to seller\". That starts a conversation you can find again under \"Messages\" in the menu. 💬",
    },
    {
      keywords: ["free", "give away", "giveaway", "giving away", "for nothing"],
      answer:
        "Some listings are given away for free. Those are marked \"Free\" on the listing, and the price is shown as \"Free\". You can choose this yourself when creating a listing.",
    },
    {
      keywords: ["how long", "expire", "expires", "expiry", "expired", "active", "60", "duration"],
      answer:
        "Listings stay active for 60 days. After that they expire automatically, but you can always post them again.",
    },
    {
      keywords: ["delete", "remove", "sold", "mark as"],
      answer:
        "You can delete a listing or mark it as sold under \"My listings\". Click the ⋮ menu on the listing to choose.",
    },
    {
      keywords: ["favorite", "favorites", "favourite", "favourites", "heart", "save", "saved", "like", "liked"],
      answer:
        "Tap the heart ❤️ on a listing to save it as a favorite. You'll find all saved listings on your profile under \"Liked listings\".",
    },
    {
      keywords: ["safe", "safety", "secure", "security", "scam", "scammer", "fraud", "pay", "payment", "meet", "meeting", "trick"],
      answer:
        "For safe trading: meet the seller in a public place, check the item before you pay, and be careful with advance payments to strangers. Use common sense, just like with any other secondhand trade. 🔒",
    },
    {
      keywords: ["search", "find", "filter", "browse", "looking for", "category"],
      answer:
        "Use the search bar at the top to find listings. After a search you can filter by category, postal code, price, condition and listing type. 🔍",
    },
    {
      keywords: ["account", "register", "sign up", "signup", "log in", "login", "profile", "user"],
      answer:
        "Click \"Sign up\" to create an account, or \"Log in\" if you already have one. You can edit your profile at any time from \"My profile\".",
    },
    {
      keywords: ["password", "forgot", "change password", "reset"],
      answer:
        "Your password is stored encrypted and securely. If you have trouble logging in, double-check the email address and password you're using.",
    },
    {
      keywords: ["dark", "light", "theme", "mode", "color", "colour", "night"],
      answer:
        "You can switch between light and dark theme with the theme button (🌙/☀️) at the bottom of the page.",
    },
    {
      keywords: ["picture", "pictures", "photo", "photos", "image", "images", "upload"],
      answer:
        "When you create a listing you can upload several photos. Good, clear photos make your listing sell faster! 📷",
    },
    {
      keywords: ["price", "cost", "costs", "fee", "fees", "charge", "pay to use"],
      answer:
        "Wisp is free to use – both posting listings and browsing. You decide the price of what you sell.",
    },
    {
      keywords: ["edit", "change", "update", "modify"],
      answer:
        "You can edit a listing under \"My listings\" – click the ⋮ menu and choose \"Edit\".",
    },
    {
      keywords: ["category", "categories", "type", "what can"],
      answer:
        "You'll find listings in many categories at the top of the front page. Click a category to see everything within it.",
    },
    {
      keywords: ["hi", "hello", "hey", "help", "question"],
      answer:
        "Hi! I'm happy to help. You can ask how to post a listing, contact a seller, save favorites, search, or trade safely. 😊",
    },
    {
      keywords: ["thanks", "thank you", "great", "awesome", "perfect"],
      answer:
        "You're welcome! 😊 Let me know if there's anything else you're wondering about.",
    },
  ],
};

const SUGGESTIONS: Record<Lang, string[]> = {
  no: [
    "Hvordan legger jeg ut en annonse?",
    "Hvordan kontakter jeg en selger?",
    "Hva betyr «Gis bort»?",
    "Hvordan lagrer jeg favoritter?",
    "Er det trygt å handle her?",
    "Koster det noe å bruke Wisp?",
  ],
  en: [
    "How do I post a listing?",
    "How do I contact a seller?",
    "What does \"Free\" mean?",
    "How do I save favorites?",
    "Is it safe to trade here?",
    "Does it cost anything to use Wisp?",
  ],
};

function findAnswer(input: string, lang: Lang): string | null {
  const text = input.toLowerCase();
  for (const entry of KNOWLEDGE[lang]) {
    if (entry.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return entry.answer;
    }
  }
  return null;
}

export default function ChatBot() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const WELCOME: Msg = { from: "bot", text: t("chat.botWelcome") };
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

  // Keep the welcome message in the active language while the
  // conversation hasn't started (saved history is left untouched).
  useEffect(() => {
    const welcomeText = t("chat.botWelcome");
    setMessages((prev) =>
      prev.length === 1 && prev[0].from === "bot" && prev[0].text !== welcomeText
        ? [{ from: "bot", text: welcomeText }]
        : prev
    );
  }, [lang, t]);

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
    const answer = findAnswer(q, lang) ?? t("chat.botFallback");
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: "bot", text: answer }]);
    }, 350);
  }

  function reset() {
    setMessages([{ from: "bot", text: t("chat.botWelcome") }]);
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
        aria-label={t("chat.openHelp")}
      >
        {open ? "✕" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[90vw] max-w-sm h-[70vh] max-h-[500px] bg-surface border border-line rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-brand text-white px-4 py-3 font-semibold shrink-0 flex items-center justify-between">
            <span>{t("chat.botName")}</span>
            {messages.length > 1 && (
              <button
                onClick={reset}
                className="text-xs bg-white/20 hover:bg-white/30 rounded-lg px-2 py-1"
              >
                ← {t("common.back")}
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
                {SUGGESTIONS[lang].map((s) => (
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
              placeholder={t("chat.questionPlaceholder")}
              className="flex-1 px-3 py-2 rounded-xl border border-line bg-subtle text-ink outline-none focus:bg-surface focus:border-brand text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark text-sm"
            >
              {t("common.send")}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
