"use client";

import { useLanguage } from "@/lib/i18n";

export default function HjelpPage() {
  const { lang } = useLanguage();

  const faqsNo = [
    {
      q: "Hvordan legger jeg ut en annonse?",
      a: "Logg inn, klikk på «+ Ny annonse», fyll ut tittel, beskrivelse, pris og last opp bilder. Du kan velge om varen selges eller gis bort gratis.",
    },
    {
      q: "Hvordan kontakter jeg en selger?",
      a: "Åpne annonsen og klikk «Send melding til selger». Da starter en samtale du finner igjen under «Meldinger».",
    },
    {
      q: "Hva betyr «Gis bort»?",
      a: "Noen annonser er gratis. Da står det «Gis bort» på annonsen, og prisen vises som «Gratis».",
    },
    {
      q: "Hvor lenge er annonsen aktiv?",
      a: "Annonser er aktive i 60 dager. Du kan når som helst markere en annonse som solgt eller slette den under «Mine annonser».",
    },
    {
      q: "Hvordan lagrer jeg favoritter?",
      a: "Trykk på hjertet på en annonse for å lagre den. Du finner alle dine lagrede annonser på profilen din under «Likte annonser».",
    },
    {
      q: "Er det trygt å handle på Wisp?",
      a: "Møt gjerne selgeren på et offentlig sted, sjekk varen før du betaler, og vær forsiktig med forskuddsbetaling til ukjente. Bruk sunn fornuft slik du ville gjort ved annen bruktkjøp.",
    },
  ];

  const faqsEn = [
    {
      q: "How do I post a listing?",
      a: "Log in, click \"+ New listing\", fill in the title, description and price, and upload photos. You can choose whether the item is for sale or given away for free.",
    },
    {
      q: "How do I contact a seller?",
      a: "Open the listing and click \"Message the seller\". This starts a conversation you can find again under \"Messages\".",
    },
    {
      q: "What does \"Free\" mean?",
      a: "Some listings are free. These are marked as give-aways on the listing, and the price is shown as \"Free\".",
    },
    {
      q: "How long does a listing stay active?",
      a: "Listings are active for 60 days. You can mark a listing as sold or delete it at any time under \"My listings\".",
    },
    {
      q: "How do I save favorites?",
      a: "Tap the heart on a listing to save it. You can find all your saved listings on your profile under \"Liked listings\".",
    },
    {
      q: "Is it safe to buy and sell on Wisp?",
      a: "Meet the seller in a public place, inspect the item before paying, and be cautious about paying strangers in advance. Use common sense, just as you would with any other secondhand purchase.",
    },
  ];

  const faqs = lang === "no" ? faqsNo : faqsEn;

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-12">
      <h1 className="text-3xl font-bold text-ink mb-6">
        {lang === "no" ? "Hjelp og ofte stilte spørsmål" : "Help and frequently asked questions"}
      </h1>

      <div className="space-y-6">
        {faqs.map((item) => (
          <div key={item.q} className="border-b border-line pb-5">
            <h2 className="font-semibold text-ink mb-2">{item.q}</h2>
            <p className="text-ink-secondary leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-muted">
        {lang === "no"
          ? "Fant du ikke svar på det du lurte på? Ta kontakt via profilen til den aktuelle annonsen, eller send oss en tilbakemelding."
          : "Didn't find the answer you were looking for? Get in touch via the profile on the listing in question, or send us your feedback."}
      </p>
    </main>
  );
}
