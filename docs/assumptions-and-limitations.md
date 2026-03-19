# DC SiteLab — Assumptions and Limitations

> **IMPORTANT DISCLAIMER:** DC SiteLab is an educational simulator. It is NOT a certified engineering design tool, structural assessment, or regulatory compliance advisory. All outputs are educational approximations and must not be used as the basis for real capital investment decisions without independent expert review.

---

## General Assumptions

| # | Assumption | Rationale |
|---|---|---|
| A1 | All scoring weights are configurable educational defaults | Actual site scoring weights depend on project-specific criteria |
| A2 | POI distance implies accessibility, not confirmed service capacity | OSM data shows location; does not confirm grid capacity, hospital beds, etc. |
| A3 | Elevation data is used as a proxy for flood and terrain risk | True flood zone assessment requires hydrological study |
| A4 | Climate data from Open-Meteo represents typical conditions | Actual site conditions may differ; microclimate effects are not captured |
| A5 | The app operates on a single point coordinate | A real site has area, boundary, and orientation — not a single point |
| A6 | All space allocation outputs are conceptual ranges | Real architectural programming depends on layout, structural grid, and MEP strategy |
| A7 | Score confidently labeled as "API Data" may still have inaccuracies | APIs have their own accuracy and coverage limitations |

---

## Data Source Limitations

### Elevation (Open-Elevation API)
- **Limitation:** Resolution is typically 30m–90m SRTM data. Precise site-level micro-elevation is not captured.
- **Impact:** Flood risk proxy may be inaccurate for sites on gentle slopes or near drainage features.
- **Label used:** `API Data` (with confidence noted as medium for risk proxy)

### Climate Data (Open-Meteo)
- **Limitation:** Historical averages, not real-time or forecasted extremes.
- **Impact:** Extreme weather events (100-year floods, unprecedented heat) are not represented.
- **Label used:** `API Data`

### POI Proximity (OSM / Overpass API)
- **Limitation:** OSM data completeness varies by region. Developing nations may have sparse POI data.
- **Impact:** Missing POIs may cause artificially high logistics scores.
- **Label used:** `API Data` with note on OSM coverage limitations

### Seismic Risk
- **Limitation:** No real-time seismic hazard API is integrated. Risk is estimated from geographic zone heuristics.
- **Impact:** Cannot replace USGS or national seismic hazard maps.
- **Label used:** `Proxy Estimate`

### Flood Risk
- **Limitation:** No FEMA or equivalent flood database is integrated. Flood risk is inferred from elevation + water body proximity.
- **Impact:** Sites with complex local drainage or below-grade features may be incorrectly scored.
- **Label used:** `Proxy Estimate`

### Grid Quality / Utility Reliability
- **Limitation:** Public APIs do not expose grid quality, utility redundancy, or capacity data.
- **Impact:** Two sites with identical coordinates could have drastically different utility situations.
- **Label used:** `Manual Assessment Required`

### Fiber / Telecom Readiness
- **Limitation:** General carrier maps are not integrated. Proximity to telecom OSM nodes is used as a weak proxy.
- **Impact:** Fiber readiness may be overestimated in areas with telecom node markers but no confirmed service.
- **Label used:** `Proxy Estimate`

### Geotechnical Suitability
- **Limitation:** Cannot be evaluated from public APIs without borehole/geotechnical survey data.
- **Impact:** Soil bearing capacity, groundwater depth, compressibility — all critical for foundation design — are not evaluated.
- **Label used:** `Manual Assessment Required`

### Permitting Complexity
- **Limitation:** Local zoning and land use regulations are not queried.
- **Impact:** A site may score well on natural factors but be entirely non-viable due to land use restrictions.
- **Label used:** `Manual Assessment Required`

---

## Planning Output Limitations

| Area | Limitation |
|---|---|
| Space allocation ranges | Based on general data center design ratios; not a structural/architectural layout |
| White space multiplier | Range provided, not a single certified ratio |
| Cooling recommendation | Conditional educational recommendation, not a full MEP engineering study |
| Electrical planning | Conceptual guidance, not a load flow analysis or switchgear specification |
| Cost estimates | No cost data is provided; cost implications are narrative/conceptual only |
| Growth planning | Growth reserve is a planning heuristic, not a detailed phasing plan |

---

## Score Interpretation Limitations

- The composite score is a weighted educational indicator, not a certified site suitability assessment.
- Two sites with equal scores may differ substantially in ways not captured by available public data.
- Scores may change as data sources improve or weights are reconfigured.
- Manual override inputs (if provided) improve accuracy significantly — their absence reduces confidence.

---

## What This App Does NOT Do

- ❌ Perform structural or geotechnical analysis
- ❌ Provide certified Tier classification (use Uptime Institute or EN 50600 for that)
- ❌ Conduct CFD (computational fluid dynamics) thermal analysis
- ❌ Confirm utility service availability, capacity, or reliability
- ❌ Guarantee data accuracy for regulatory, legal, or investment purposes
- ❌ Replace a professional due diligence process
- ❌ Model real-time conditions or disaster scenarios

---

## What This App CAN Do

- ✅ Educate on multi-factor site selection logic
- ✅ Illustrate trade-offs between competing site factors
- ✅ Indicate potential red flags using public data proxies
- ✅ Guide early-stage concept planning with appropriate ranges
- ✅ Explain every score and recommendation transparently
- ✅ Compare multiple sites on key educational metrics
- ✅ Demonstrate how domain rules translate to site selection decisions

---

*Last updated: 2026-03-19 | DC SiteLab v1.0*
