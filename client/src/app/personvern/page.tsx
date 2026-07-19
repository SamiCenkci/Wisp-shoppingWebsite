export default function PersonvernPage() {
  return (
    <main className="max-w-3xl mx-auto px-[5%] py-12">
      <h1 className="text-3xl font-bold text-ink mb-6">Personvernerklæring</h1>

      <div className="space-y-6 text-ink-secondary leading-relaxed">
        <p className="text-sm text-ink-muted">
          Sist oppdatert: {new Date().toLocaleDateString("nb-NO", { year: "numeric", month: "long" })}
        </p>

        <section>
          <h2 className="font-semibold text-ink mb-2">Hvilke opplysninger vi samler inn</h2>
          <p>
            For å bruke Wisp registrerer du en konto med navn og e-postadresse. Når du bruker
            tjenesten, lagrer vi også innhold du selv oppretter, som annonser, bilder,
            meldinger og favoritter, samt valgfrie profilopplysninger du legger inn.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink mb-2">Hvordan vi bruker opplysningene</h2>
          <p>
            Opplysningene brukes til å drive tjenesten: vise annonsene dine, la deg søke og
            kommunisere med andre brukere, og holde kontoen din trygg. Passord lagres alltid
            kryptert, aldri i klartekst.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink mb-2">Deling av opplysninger</h2>
          <p>
            Enkelte opplysninger er synlige for andre brukere, for eksempel navnet ditt og
            annonsene dine. Vi selger ikke personopplysningene dine til tredjeparter. Bilder
            lagres hos vår skyleverandør, og tjenesten driftes på sikre skyplattformer.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink mb-2">Dine rettigheter</h2>
          <p>
            Du kan når som helst redigere profilen din, slette annonsene dine, eller be om at
            kontoen din slettes. Du har rett til innsyn i og sletting av opplysningene vi har
            om deg, i tråd med personvernregelverket (GDPR).
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-ink mb-2">Informasjonskapsler</h2>
          <p>
            Wisp bruker nettleserlagring for å holde deg innlogget og huske innstillinger som
            lyst/mørkt tema og nylige søk. Denne informasjonen ligger lokalt i nettleseren din.
          </p>
        </section>

        <p className="text-sm text-ink-muted border-t border-line pt-5">
          Wisp er et personlig prosjekt. Denne erklæringen beskriver hvordan tjenesten
          håndterer data, men er ikke juridisk rådgivning.
        </p>
      </div>
    </main>
  );
}