"use client";

import { useLanguage } from "@/lib/i18n";

export default function OmOssPage() {
  const { lang } = useLanguage();

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-12">
      <h1 className="text-3xl font-bold text-ink mb-6">
        {lang === "no" ? "Om Wisp" : "About Wisp"}
      </h1>

      <div className="space-y-5 text-ink-secondary leading-relaxed">
        {lang === "no" ? (
          <>
            <p>
              Wisp er en markedsplass for kjøp og salg av brukte ting i Norge. Målet vårt er
              enkelt: gjøre det trygt og enkelt å gi ting et nytt liv i stedet for at de havner
              i søpla.
            </p>
            <p>
              Enten du vil selge noe du ikke lenger trenger, gi bort ting gratis, eller finne et
              godt kjøp, er Wisp bygget for å gjøre prosessen rask og oversiktlig. Du kan legge ut
              annonser med bilder, søke og filtrere, og chatte direkte med kjøpere og selgere.
            </p>
            <p>
              Wisp er utviklet som et personlig prosjekt med moderne webteknologi, med fokus på
              brukervennlighet, ytelse og et rent design.
            </p>
          </>
        ) : (
          <>
            <p>
              Wisp is a marketplace for buying and selling secondhand items in Norway. Our goal
              is simple: make it safe and easy to give things a new life instead of letting them
              end up in the trash.
            </p>
            <p>
              Whether you want to sell something you no longer need, give things away for free,
              or find a great deal, Wisp is built to make the process quick and straightforward.
              You can post listings with photos, search and filter, and chat directly with buyers
              and sellers.
            </p>
            <p>
              Wisp is developed as a personal project using modern web technology, with a focus
              on usability, performance, and clean design.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
