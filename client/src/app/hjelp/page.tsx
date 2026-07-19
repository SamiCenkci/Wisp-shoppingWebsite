export default function HjelpPage() {
  const faqs = [
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

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-12">
      <h1 className="text-3xl font-bold text-ink mb-6">Hjelp og ofte stilte spørsmål</h1>

      <div className="space-y-6">
        {faqs.map((item) => (
          <div key={item.q} className="border-b border-line pb-5">
            <h2 className="font-semibold text-ink mb-2">{item.q}</h2>
            <p className="text-ink-secondary leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>

      <p className="mt-8 text-sm text-ink-muted">
        Fant du ikke svar på det du lurte på? Ta kontakt via profilen til den aktuelle
        annonsen, eller send oss en tilbakemelding.
      </p>
    </main>
  );
}