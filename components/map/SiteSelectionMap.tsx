"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useSiteSelectionStore } from "@/store/site-selection.store";
import {
  TIER_CRITERIA,
  CRITERION_LAYERS,
  createGeoJSONCircle,
} from "@/rules/tier-criteria";
import { fetchAllPOIs, type OverpassPOI } from "@/services/overpass.service";



// ─── Verified fallback POIs with real coordinates ────────────────────────
const FALLBACK_POIS: Record<string, Array<{ lat: number; lng: number; name: string }>> = {
  powerPlant: [
    { lat: 41.4817, lng: 27.3372, name: "Hamitabat Doğalgaz Santrali" },        // Lüleburgaz, Kırklareli
    { lat: 40.9817, lng: 28.6908, name: "Ambarlı Termik Santrali" },             // Avcılar, İstanbul
    { lat: 41.2070, lng: 28.1305, name: "Çatalca Doğalgaz Santrali" },           // Çatalca, İstanbul
    { lat: 39.7767, lng: 32.6800, name: "Ankara Sincan Enerji Santrali" },       // Sincan, Ankara
    { lat: 40.7200, lng: 30.0100, name: "Adapazarı Doğalgaz Santrali" },         // Adapazarı, Sakarya
  ],
  flightPath: [
    { lat: 40.1280, lng: 32.9950, name: "Ankara Esenboğa Havalimanı" },          // Esenboğa, Ankara
    { lat: 41.2622, lng: 28.7278, name: "İstanbul Havalimanı" },                 // Arnavutköy, İstanbul
    { lat: 40.8986, lng: 29.3092, name: "Sabiha Gökçen Havalimanı" },            // Pendik, İstanbul
    { lat: 41.1383, lng: 27.9133, name: "T. Uzunköprü Havaalanı" },              // Tekirdağ/Çorlu
    { lat: 40.2350, lng: 29.0090, name: "Bursa Yenişehir Havalimanı" },          // Bursa
  ],
  fuelStation: [
    { lat: 41.7350, lng: 27.2250, name: "Petrol Ofisi - Kırklareli Merkez" },    // Kırklareli merkez D-020
    { lat: 41.4050, lng: 27.3550, name: "Shell - Lüleburgaz" },                  // Lüleburgaz E-80 üzeri
    { lat: 41.1780, lng: 27.8150, name: "Opet - Çorlu" },                        // Çorlu, Tekirdağ
    { lat: 39.9250, lng: 32.8600, name: "BP - Ankara Kızılay" },                 // Kızılay, Ankara
    { lat: 41.0080, lng: 28.9770, name: "TP - İstanbul Fatih" },                 // Fatih, İstanbul
    { lat: 41.4300, lng: 27.2900, name: "Opet - Babaeski" },                     // Babaeski, Kırklareli
  ],
  highway: [
    { lat: 41.7380, lng: 27.0950, name: "D-020 Kırklareli - Edirne" },           // D-020 Kırklareli batı çıkışı
    { lat: 41.4100, lng: 27.4800, name: "E-80 Otoyolu - Lüleburgaz" },           // E-80 Lüleburgaz geçişi
    { lat: 41.1700, lng: 27.8200, name: "TEM Otoyolu - Çorlu" },                 // TEM Çorlu kavşağı
    { lat: 39.9300, lng: 32.7200, name: "O-4 Ankara Çevre Otoyolu" },            // Ankara çevre yolu
    { lat: 40.8350, lng: 29.4150, name: "TEM Otoyolu - Gebze" },                 // TEM Gebze bağlantısı
  ],
  hospital: [
    { lat: 41.7485, lng: 27.2356, name: "Kırklareli Eğitim ve Araştırma Hastanesi" },  // Kırklareli merkez
    { lat: 41.4085, lng: 27.3688, name: "Lüleburgaz Devlet Hastanesi" },                // Lüleburgaz
    { lat: 39.9007, lng: 32.7570, name: "Ankara Bilkent Şehir Hastanesi" },             // Bilkent, Ankara
    { lat: 41.0050, lng: 28.9400, name: "İstanbul Çapa Tıp Fakültesi" },                // Çapa, İstanbul
    { lat: 41.1830, lng: 27.7900, name: "Çorlu Devlet Hastanesi" },                     // Çorlu, Tekirdağ
    { lat: 40.1870, lng: 29.0510, name: "Bursa Şehir Hastanesi" },                      // Bursa
  ],
  fireStation: [
    { lat: 41.7340, lng: 27.2250, name: "Kırklareli İtfaiye Müdürlüğü" },       // Kırklareli merkez
    { lat: 41.4020, lng: 27.3550, name: "Lüleburgaz İtfaiye" },                  // Lüleburgaz
    { lat: 39.9400, lng: 32.8530, name: "Ankara Büyükşehir İtfaiye" },           // Ankara merkez
    { lat: 41.0130, lng: 28.9550, name: "İstanbul İtfaiye - Fatih" },            // Fatih, İstanbul
    { lat: 41.1750, lng: 27.8100, name: "Çorlu İtfaiye" },                       // Çorlu, Tekirdağ
  ],
  waterBody: [
    { lat: 41.7550, lng: 27.2100, name: "Şeytandere (Kırklareli)" },             // Kırklareli kuzey
    { lat: 41.3950, lng: 27.3592, name: "Ergene Nehri - Lüleburgaz" },           // Lüleburgaz güney
    { lat: 41.1600, lng: 27.7800, name: "Ergene Nehri - Çorlu" },                // Çorlu
    { lat: 39.9700, lng: 32.8300, name: "Çubuk Çayı - Ankara" },                 // Ankara kuzey
    { lat: 41.4800, lng: 27.2200, name: "Teke Deresi - Kırklareli" },            // Kırklareli
  ],
};

// Simulated parcel data
const ZONING_OPTIONS = [
  { en: "Industrial", tr: "Sanayi" },
  { en: "Agricultural", tr: "Tarım" },
  { en: "Residential", tr: "Konut" },
  { en: "Commercial", tr: "Ticari" },
  { en: "Mixed Use", tr: "Karma Kullanım" },
  { en: "Organized Industrial Zone", tr: "Organize Sanayi Bölgesi" },
];

function getSimulatedParcelInfo(lat: number, lng: number) {
  const seed = Math.abs(Math.sin(lat * 12345.6789 + lng * 98765.4321)) * 10000;
  const zoningIdx = Math.floor(seed) % ZONING_OPTIONS.length;
  const zoning = ZONING_OPTIONS[zoningIdx];
  const pricePerM2 = Math.round(50 + (seed % 450));
  const areaM2 = Math.round(1000 + (seed % 19000));
  return {
    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    estimatedPricePerM2: pricePerM2,
    estimatedTotalPrice: pricePerM2 * areaM2,
    zoningStatus: zoning.en,
    zoningStatusTr: zoning.tr,
    areaM2,
  };
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Component ──────────────────────────────────────────────────────────────
export function SiteSelectionMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [maplibre, setMaplibre] = useState<any>(null);
  const poiFetchedRef = useRef<string | null>(null);

  const {
    dcSpecs,
    layers,
    layerRadii,
    showHeatMap,
    setSelectedParcel,
    mapCenter,
    setMapCenter,
    setSuitabilityGrid,
    poiData,
    setPOIData,
    setIsLoadingPOIs,
    flyToCoords,
    setFlyTo,
  } = useSiteSelectionStore();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    let isMounted = true;

    import("maplibre-gl").then((mod) => {
      if (!isMounted || !mapContainer.current) return;
      setMaplibre(mod.default);

      const map = new mod.default.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution: "© OpenStreetMap contributors",
            },
          },
          layers: [
            {
              id: "osm-tiles",
              type: "raster",
              source: "osm-tiles",
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [mapCenter.lng, mapCenter.lat],
        zoom: 6, // Turkey overview
        minZoom: 5,
        maxBounds: [[25, 35], [45, 43]], // Roughly Turkey bounds
      });

      map.on("load", () => {
        if (!isMounted) return;
        setMapLoaded(true);
        mapRef.current = map;
      });

      // Fetch POIs when map stops moving after user zooms in
      map.on("moveend", () => {
        const z = map.getZoom();
        if (z >= 9) {
          const center = map.getCenter();
          const key = `${center.lat.toFixed(1)},${center.lng.toFixed(1)}`;
          if (poiFetchedRef.current !== key) {
            poiFetchedRef.current = key;
            setMapCenter({ lat: center.lat, lng: center.lng });
            loadPOIs(center.lat, center.lng);
          }
        }
      });

      // Parcel click
      map.on("click", (e: any) => {
        handleMapClick(e.lngLat.lat, e.lngLat.lng);
      });
    });

    return () => {
      isMounted = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle flyTo from store (when user clicks a POI name)
  useEffect(() => {
    if (!flyToCoords || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyToCoords.lng, flyToCoords.lat],
      zoom: flyToCoords.zoom || 13,
      duration: 1500,
    });
    setFlyTo(null);
  }, [flyToCoords, setFlyTo]);

  // Load POIs for visible area
  function loadPOIs(lat: number, lng: number) {
    setIsLoadingPOIs(true);
    fetchAllPOIs({ lat, lng }, 50)
      .then((results) => {
        for (const [layerId, pois] of Object.entries(results)) {
          if (pois.length > 0) {
            setPOIData(
              layerId,
              pois.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name, type: p.type }))
            );
          }
        }
      })
      .catch((err) => {
        console.warn("Overpass POI fetch failed, using fallbacks:", err);
      })
      .finally(() => {
        setIsLoadingPOIs(false);
      });
  }

  // Initial load
  useEffect(() => {
    if (mapLoaded && !poiFetchedRef.current) {
      poiFetchedRef.current = "initial";
      loadPOIs(mapCenter.lat, mapCenter.lng);
    }
  }, [mapLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      const parcelData = getSimulatedParcelInfo(lat, lng);
      let score = 100;
      const compliance: Record<string, boolean> = {};
      const nearbyPOIs: Array<{ name: string; type: string; distanceKm: number; lat: number; lng: number }> = [];

      for (const layer of CRITERION_LAYERS) {
        const pois = getActivePOIs(layer.id);
        const radius = layerRadii[layer.id] ?? 10;
        let nearest = Infinity;
        let nearestPOI: any = null;
        for (const poi of pois) {
          const dist = haversineKm(lat, lng, poi.lat, poi.lng);
          if (dist < nearest) { nearest = dist; nearestPOI = poi; }
        }

        if (nearestPOI) {
          nearbyPOIs.push({
            name: nearestPOI.name,
            type: layer.id,
            distanceKm: Math.round(nearest * 10) / 10,
            lat: nearestPOI.lat,
            lng: nearestPOI.lng,
          });
        }

        if (layer.type === "min-distance") {
          compliance[layer.id] = nearest >= radius;
          if (nearest < radius) score -= ((radius - nearest) / radius) * 30;
        } else {
          compliance[layer.id] = nearest <= radius;
          if (nearest > radius) score -= ((nearest - radius) / radius) * 25;
        }
      }

      setSelectedParcel({
        coordinates: { lat, lng },
        ...parcelData,
        suitabilityScore: Math.max(0, Math.min(100, Math.round(score))),
        tierCompliance: compliance,
        nearbyPOIs,
      });
    },
    [layerRadii, poiData, setSelectedParcel] // eslint-disable-line react-hooks/exhaustive-deps
  );

  function getActivePOIs(layerId: string): Array<{ lat: number; lng: number; name: string }> {
    const real = poiData[layerId];
    if (real && real.length > 0) return real;
    return FALLBACK_POIS[layerId] || [];
  }

  // Update circle layers + POI symbol layers (WebGL — no drift on zoom)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Remove old circle layers/sources
    for (const layer of CRITERION_LAYERS) {
      try { map.removeLayer(`circle-line-${layer.id}`); } catch {}
      try { map.removeLayer(`circle-fill-${layer.id}`); } catch {}
      try { map.removeSource(`circle-src-${layer.id}`); } catch {}
      // Remove old symbol layers
      try { map.removeLayer(`poi-symbol-${layer.id}`); } catch {}
      try { map.removeLayer(`poi-label-${layer.id}`); } catch {}
      try { map.removeSource(`poi-src-${layer.id}`); } catch {}
    }

    for (const layer of CRITERION_LAYERS) {
      if (!layers[layer.id as keyof typeof layers]) continue;
      const pois = getActivePOIs(layer.id);
      const radiusKm = layerRadii[layer.id] ?? 10;

      // Circle radius layers
      const circleFeatures = pois.map((poi) =>
        createGeoJSONCircle([poi.lng, poi.lat], radiusKm)
      );

      const circleSrcId = `circle-src-${layer.id}`;
      map.addSource(circleSrcId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: circleFeatures },
      });
      map.addLayer({
        id: `circle-fill-${layer.id}`,
        type: "fill",
        source: circleSrcId,
        paint: { "fill-color": layer.color, "fill-opacity": 0.08 },
      });
      map.addLayer({
        id: `circle-line-${layer.id}`,
        type: "line",
        source: circleSrcId,
        paint: {
          "line-color": layer.color,
          "line-width": 2,
          "line-dasharray": layer.type === "min-distance" ? [4, 2] : [1, 0],
        },
      });

      // POI points as native circle + text symbol layers (WebGL — stays in place during zoom)
      const poiFeatures = pois.map((poi) => ({
        type: "Feature" as const,
        properties: { name: poi.name, radiusKm, layerType: layer.type },
        geometry: { type: "Point" as const, coordinates: [poi.lng, poi.lat] },
      }));

      const poiSrcId = `poi-src-${layer.id}`;
      map.addSource(poiSrcId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: poiFeatures },
      });

      // Colored circle marker
      map.addLayer({
        id: `poi-symbol-${layer.id}`,
        type: "circle",
        source: poiSrcId,
        paint: {
          "circle-radius": 10,
          "circle-color": layer.color,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2.5,
        },
      });

      // Text label
      map.addLayer({
        id: `poi-label-${layer.id}`,
        type: "symbol",
        source: poiSrcId,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.8],
          "text-anchor": "top",
          "text-max-width": 12,
          "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.75)",
          "text-halo-width": 1.5,
        },
      });

      // Click handler — show popup on click
      map.on("click", `poi-symbol-${layer.id}`, (e: any) => {
        if (!e.features?.length) return;
        const feat = e.features[0];
        const coords = feat.geometry.coordinates.slice();
        const name = feat.properties.name;

        if (maplibre) {
          new maplibre.Popup({ offset: 14, closeButton: false, maxWidth: "240px" })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:12px;font-weight:600;color:#1a1a1a;padding:4px 8px;">
                ${name}
                <br/><span style="opacity:0.5;font-size:10px;font-weight:400;">${radiusKm} km ${layer.type === "min-distance" ? "min" : "max"}</span>
              </div>`
            )
            .addTo(map);
        }
      });

      // Pointer cursor on hover
      map.on("mouseenter", `poi-symbol-${layer.id}`, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", `poi-symbol-${layer.id}`, () => {
        map.getCanvas().style.cursor = "";
      });
    }
  }, [dcSpecs.tierLevel, layers, layerRadii, mapLoaded, maplibre, poiData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Heat map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const heatSrcId = "suitability-heat-src";
    const heatLayerId = "suitability-heat-layer";
    if (map.getLayer(heatLayerId)) map.removeLayer(heatLayerId);
    if (map.getSource(heatSrcId)) map.removeSource(heatSrcId);
    if (!showHeatMap) return;

    const gridCells: Array<{ lat: number; lng: number; score: number }> = [];
    const step = 0.02;
    const bounds = {
      latMin: mapCenter.lat - 0.15,
      latMax: mapCenter.lat + 0.15,
      lngMin: mapCenter.lng - 0.2,
      lngMax: mapCenter.lng + 0.2,
    };
    for (let lat = bounds.latMin; lat <= bounds.latMax; lat += step) {
      for (let lng = bounds.lngMin; lng <= bounds.lngMax; lng += step) {
        let s = 100;
        for (const layer of CRITERION_LAYERS) {
          const pois = getActivePOIs(layer.id);
          if (!pois.length) continue;
          let nearest = Infinity;
          for (const poi of pois) { const d = haversineKm(lat, lng, poi.lat, poi.lng); if (d < nearest) nearest = d; }
          const t = layerRadii[layer.id] ?? 10;
          if (layer.type === "min-distance") { if (nearest < t) s -= ((t - nearest) / t) * 30; }
          else { if (nearest > t) s -= ((nearest - t) / t) * 25; }
        }
        gridCells.push({ lat, lng, score: Math.max(0, Math.min(100, Math.round(s))) });
      }
    }
    setSuitabilityGrid(gridCells);

    const features = gridCells.filter((c) => c.score > 30).map((c) => ({
      type: "Feature" as const,
      properties: { weight: c.score / 100 },
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
    }));

    map.addSource(heatSrcId, { type: "geojson", data: { type: "FeatureCollection", features } });
    map.addLayer({
      id: heatLayerId, type: "heatmap", source: heatSrcId,
      paint: {
        "heatmap-weight": ["get", "weight"],
        "heatmap-intensity": 1.2,
        "heatmap-color": [
          "interpolate", ["linear"], ["heatmap-density"],
          0, "rgba(0,0,0,0)", 0.2, "rgba(34,197,94,0.15)", 0.4, "rgba(34,197,94,0.3)",
          0.6, "rgba(22,163,74,0.45)", 0.8, "rgba(21,128,61,0.6)", 1.0, "rgba(20,83,45,0.75)",
        ],
        "heatmap-radius": 40, "heatmap-opacity": 0.7,
      },
    });
  }, [layerRadii, showHeatMap, mapLoaded, mapCenter, poiData, setSuitabilityGrid]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 3D DC Building + Distance Lines ────────────────────────────────────
  const selectedParcel = useSiteSelectionStore((s) => s.selectedParcel);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // Layer IDs for cleanup
    const buildingLayerId = "dc-building-3d";
    const buildingSrcId = "dc-building-src";
    const linesSrcId = "dc-distance-lines-src";
    const linesLayerId = "dc-distance-lines";
    const labelsSrcId = "dc-distance-labels-src";
    const labelsLayerId = "dc-distance-labels";
    const outlineSrcId = "dc-building-outline-src";
    const outlineLayerId = "dc-building-outline";

    // Clean up previous
    try { map.removeLayer(buildingLayerId); } catch {}
    try { map.removeSource(buildingSrcId); } catch {}
    try { map.removeLayer(linesLayerId); } catch {}
    try { map.removeSource(linesSrcId); } catch {}
    try { map.removeLayer(labelsLayerId); } catch {}
    try { map.removeSource(labelsSrcId); } catch {}
    try { map.removeLayer(outlineLayerId); } catch {}
    try { map.removeSource(outlineSrcId); } catch {}

    if (!selectedParcel) return;

    const { lat, lng } = selectedParcel.coordinates;

    // Calculate building size from closedAreaM2 (convert m² to degrees approx)
    const areaM2 = dcSpecs.closedAreaM2 || 2500;
    const sideM = Math.sqrt(areaM2);
    // ~111,320 meters per degree lat, ~85,000 at Turkey's latitude
    const dLat = (sideM / 111320) * 0.6;
    const dLng = (sideM / 85000) * 1.0;

    // Rectangle corners for DC building
    const buildingCoords = [
      [lng - dLng, lat - dLat],
      [lng + dLng, lat - dLat],
      [lng + dLng, lat + dLat],
      [lng - dLng, lat + dLat],
      [lng - dLng, lat - dLat],
    ];

    // Building height proportional to MW capacity
    const heightM = Math.max(15, (dcSpecs.powerMW || 5) * 4);

    // Add 3D extruded building
    map.addSource(buildingSrcId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: { height: heightM, base: 0 },
          geometry: { type: "Polygon", coordinates: [buildingCoords] },
        }],
      },
    });

    map.addLayer({
      id: buildingLayerId,
      type: "fill-extrusion",
      source: buildingSrcId,
      paint: {
        "fill-extrusion-color": "#3b82f6",
        "fill-extrusion-height": ["get", "height"],
        "fill-extrusion-base": ["get", "base"],
        "fill-extrusion-opacity": 0.85,
      },
    });

    // Building footprint outline
    map.addSource(outlineSrcId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          properties: {},
          geometry: { type: "Polygon", coordinates: [buildingCoords] },
        }],
      },
    });

    map.addLayer({
      id: outlineLayerId,
      type: "line",
      source: outlineSrcId,
      paint: {
        "line-color": "#60a5fa",
        "line-width": 2,
        "line-dasharray": [2, 1],
      },
    });

    // Distance lines to each nearest POI
    const lineFeatures: any[] = [];
    const labelFeatures: any[] = [];

    if (selectedParcel.nearbyPOIs) {
      for (const poi of selectedParcel.nearbyPOIs) {
        const layerConfig = CRITERION_LAYERS.find((l) => l.id === poi.type);
        const color = layerConfig?.color || "#9ca3af";

        // Line from DC to POI
        lineFeatures.push({
          type: "Feature",
          properties: { color },
          geometry: {
            type: "LineString",
            coordinates: [[lng, lat], [poi.lng, poi.lat]],
          },
        });

        // Midpoint label
        const midLat = (lat + poi.lat) / 2;
        const midLng = (lng + poi.lng) / 2;
        labelFeatures.push({
          type: "Feature",
          properties: {
            label: `${poi.distanceKm} km`,
            name: poi.name,
            color,
          },
          geometry: { type: "Point", coordinates: [midLng, midLat] },
        });
      }
    }

    // Add lines
    map.addSource(linesSrcId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: lineFeatures },
    });

    map.addLayer({
      id: linesLayerId,
      type: "line",
      source: linesSrcId,
      paint: {
        "line-color": ["get", "color"],
        "line-width": 2,
        "line-dasharray": [6, 3],
        "line-opacity": 0.8,
      },
    });

    // Add distance labels at midpoints
    map.addSource(labelsSrcId, {
      type: "geojson",
      data: { type: "FeatureCollection", features: labelFeatures },
    });

    map.addLayer({
      id: labelsLayerId,
      type: "symbol",
      source: labelsSrcId,
      layout: {
        "text-field": ["concat", ["get", "label"], "\n", ["get", "name"]],
        "text-size": 11,
        "text-font": ["Open Sans Regular", "Arial Unicode MS Regular"],
        "text-anchor": "center",
        "text-max-width": 14,
        "text-allow-overlap": true,
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.8)",
        "text-halo-width": 1.5,
      },
    });

    // Tilt camera to show 3D perspective
    map.easeTo({
      center: [lng, lat],
      zoom: Math.max(map.getZoom(), 11),
      pitch: 55,
      bearing: -20,
      duration: 1200,
    });
  }, [selectedParcel, mapLoaded, dcSpecs.closedAreaM2, dcSpecs.powerMW]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80">
          <div className="text-sm text-muted-foreground animate-pulse">Harita yükleniyor…</div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg border border-border/50 p-3 text-[11px] max-w-[220px]">
        <div className="font-semibold text-foreground mb-2">Katman Renkleri</div>
        {CRITERION_LAYERS.map((layer) => {
          const isVisible = layers[layer.id as keyof typeof layers];
          if (!isVisible) return null;
          const radius = layerRadii[layer.id] ?? 10;
          const tierDefault = TIER_CRITERIA[dcSpecs.tierLevel][layer.thresholdKey] as number;
          const isCustom = Math.abs(radius - tierDefault) > 0.1;
          return (
            <div key={layer.id} className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-full border border-white/30 flex-shrink-0" style={{ background: layer.color }} />
              <span className="text-muted-foreground leading-tight">
                {layer.id === "powerPlant" && "Enerji Santrali"}
                {layer.id === "flightPath" && "Uçuş Yolu"}
                {layer.id === "fuelStation" && "Yakıt İstasyonu"}
                {layer.id === "highway" && "Otoyol"}
                {layer.id === "hospital" && "Hastane"}
                {layer.id === "fireStation" && "İtfaiye"}
                {layer.id === "waterBody" && "Su Kaynağı"}
                <span className={`ml-1 ${isCustom ? "text-amber-400 font-semibold" : "opacity-60"}`}>{radius}km{isCustom && " ★"}</span>
              </span>
            </div>
          );
        })}
        {showHeatMap && (
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-border/30">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(20,83,45,0.8))" }} />
            <span className="text-muted-foreground">Uygunluk Isı Haritası</span>
          </div>
        )}
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-2 right-2 z-10 bg-background/80 backdrop-blur-sm text-[10px] text-muted-foreground px-2 py-1 rounded">
        Yakınlaştırınca POI verileri yüklenir • Tıklayarak arazi analizi yapın
      </div>
    </div>
  );
}
