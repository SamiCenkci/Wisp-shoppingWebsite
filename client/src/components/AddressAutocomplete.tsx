"use client";

import { useEffect, useRef, useState } from "react";

export type SelectedAddress = {
  street: string;
  postalCode: string;
  city: string;
  county: string;
  latitude: number;
  longitude: number;
};

type Suggestion = {
  adressetekst: string;
  postnummer: string;
  poststed: string;
  fylkesnavn?: string;
  kommunenavn?: string;
  representasjonspunkt?: { lat: number; lon: number };
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: SelectedAddress) => void;
  placeholder?: string;
  className?: string;
};

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Skriv inn adresse...",
  className = "",
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextRef = useRef(false);

  useEffect(() => {
    // Don't re-search right after the user picked a suggestion
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url =
          "https://ws.geonorge.no/adresser/v1/sok?sok=" +
          encodeURIComponent(value.trim()) +
          "&treffPerSide=6&asciiKompatibel=true";
        const res = await fetch(url);
        if (!res.ok) throw new Error("search failed");
        const data = await res.json();
        setSuggestions(data.adresser ?? []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function pick(s: Suggestion) {
    skipNextRef.current = true;
    onChange(s.adressetekst);
    onSelect({
      street: s.adressetekst,
      postalCode: s.postnummer ?? "",
      city: s.poststed ?? "",
      county: s.fylkesnavn ?? s.kommunenavn ?? "",
      latitude: s.representasjonspunkt?.lat ?? 0,
      longitude: s.representasjonspunkt?.lon ?? 0,
    });
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />

      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-muted">Søker...</span>
      )}

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-surface border border-line rounded-xl shadow-lg py-1 z-50 max-h-64 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={`${s.adressetekst}-${s.postnummer}-${i}`}
              type="button"
              onMouseDown={() => pick(s)}
              className="w-full text-left px-4 py-2.5 hover:bg-subtle flex flex-col"
            >
              <span className="text-sm text-ink">{s.adressetekst}</span>
              <span className="text-xs text-ink-muted">
                {s.postnummer} {s.poststed}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}