"use client";

import { useLanguage } from "@/lib/i18n";

export default function PersonvernPage() {
  const { lang } = useLanguage();

  return (
    <main className="max-w-3xl mx-auto px-[5%] py-12">
      <h1 className="text-3xl font-bold text-ink mb-6">
        {lang === "no" ? "Personvernerklæring" : "Privacy Policy"}
      </h1>

      <div className="space-y-6 text-ink-secondary leading-relaxed">
        <p className="text-sm text-ink-muted">
          {lang === "no" ? "Sist oppdatert: " : "Last updated: "}
          {new Date().toLocaleDateString(lang === "no" ? "nb-NO" : "en-GB", {
            year: "numeric",
            month: "long",
          })}
        </p>

        {lang === "no" ? (
          <>
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
          </>
        ) : (
          <>
            <section>
              <h2 className="font-semibold text-ink mb-2">What information we collect</h2>
              <p>
                To use Wisp, you register an account with your name and email address. When you
                use the service, we also store content you create yourself, such as listings,
                photos, messages and favorites, as well as any optional profile details you
                choose to provide.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-ink mb-2">How we use the information</h2>
              <p>
                The information is used to operate the service: displaying your listings, letting
                you search and communicate with other users, and keeping your account secure.
                Passwords are always stored encrypted, never in plain text.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-ink mb-2">Sharing of information</h2>
              <p>
                Some information is visible to other users, such as your name and your listings.
                We do not sell your personal data to third parties. Photos are stored with our
                cloud provider, and the service runs on secure cloud platforms.
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-ink mb-2">Your rights</h2>
              <p>
                You can edit your profile, delete your listings, or request that your account be
                deleted at any time. You have the right to access and erase the information we
                hold about you, in accordance with data protection law (GDPR).
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-ink mb-2">Cookies</h2>
              <p>
                Wisp uses browser storage to keep you logged in and to remember settings such as
                light/dark theme and recent searches. This information is stored locally in your
                browser.
              </p>
            </section>

            <p className="text-sm text-ink-muted border-t border-line pt-5">
              Wisp is a personal project. This statement describes how the service handles data,
              but it is not legal advice.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
