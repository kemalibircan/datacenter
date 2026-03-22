"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import type { Coordinates, SiteAnalysisResult } from "@/types/domain";

interface MapSelectorProps {
  initialCoords?: Coordinates;
  onLocationSelected: (coords: Coordinates) => void;
  analysisResult?: SiteAnalysisResult | null;
}

export function MapSelector({ initialCoords, onLocationSelected, analysisResult }: MapSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let isMounted = true;
    const center: [number, number] = initialCoords
      ? [initialCoords.lng, initialCoords.lat]
      : [20, 30];

    import("maplibre-gl").then((maplibregl) => {
      if (!isMounted || !mapContainer.current) return;

      const map = new maplibregl.default.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "raster-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "simple-tiles",
              type: "raster",
              source: "raster-tiles",
              minzoom: 0,
              maxzoom: 22,
            },
          ],
        },
        center,
        zoom: initialCoords ? 10 : 2.5,
      });

      map.on("load", () => {
        if (!isMounted) return;
        setMapLoaded(true);
        mapRef.current = map;

        // Place initial marker if coords provided
        if (initialCoords) {
          const marker = new maplibregl.default.Marker({ color: "#3b82f6" })
            .setLngLat([initialCoords.lng, initialCoords.lat])
            .addTo(map);
          markerRef.current = marker;
        }
      });

      map.on("click", (e) => {
        const coords: Coordinates = { lat: e.lngLat.lat, lng: e.lngLat.lng };

        // Update marker
        if (markerRef.current) {
          markerRef.current.setLngLat([coords.lng, coords.lat]);
        } else {
          const marker = new maplibregl.default.Marker({ color: "#3b82f6" })
            .setLngLat([coords.lng, coords.lat])
            .addTo(map);
          markerRef.current = marker;
        }

        onLocationSelected(coords);
      });
    });

    return () => {
      isMounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan to initial coords when they change
  useEffect(() => {
    if (initialCoords && mapRef.current && mapLoaded) {
      mapRef.current.flyTo({ center: [initialCoords.lng, initialCoords.lat], zoom: 10 });
      if (markerRef.current) {
        markerRef.current.setLngLat([initialCoords.lng, initialCoords.lat]);
      }
    }
  }, [initialCoords, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80">
          <div className="text-sm text-muted-foreground animate-pulse">Loading map…</div>
        </div>
      )}
      <div className="absolute bottom-2 right-2 z-10 bg-background/80 backdrop-blur-sm text-[10px] text-muted-foreground px-2 py-1 rounded">
        Click anywhere to analyze a location
      </div>
    </div>
  );
}
