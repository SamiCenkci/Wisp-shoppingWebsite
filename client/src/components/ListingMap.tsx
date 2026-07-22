"use client";

import { useEffect, useRef } from "react";

type Props = {
  latitude: number;
  longitude: number;
  label?: string;
};

export default function ListingMap({ latitude, longitude, label }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        scrollWheelZoom: false,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      // Approximate area rather than an exact pin
      L.circle([latitude, longitude], {
        radius: 400,
        color: "#1A9E4B",
        fillColor: "#1A9E4B",
        fillOpacity: 0.15,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(label || "Omtrentlig område");
    }

    init();

    return () => {
      cancelled = true;
      const map = mapRef.current as { remove?: () => void } | null;
      if (map?.remove) map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, label]);

  return <div ref={containerRef} className="w-full h-64 rounded-2xl overflow-hidden border border-line z-0" />;
}