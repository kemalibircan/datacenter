# DC SiteLab — Methodology

> This document explains how DC SiteLab evaluates sites, generates scores, produces planning recommendations, and ensures educational transparency.

---

## 1. Site Evaluation Methodology

### 1.1 Step 1 — Location Acquisition

The user provides a geographic coordinate (lat/lng) by:
- Clicking on the world map
- Searching by address or city name (geocoded via Nominatim)
- Selecting a preset demo scenario

### 1.2 Step 2 — Data Acquisition

DC SiteLab queries multiple provider categories concurrently:

| Provider Category | Data Obtained | Source |
|---|---|---|
| Elevation | Altitude in meters above sea level | Open-Elevation API |
| Climate | Monthly avg temperature, precipitation | Open-Meteo Historical API |
| POI / Logistics | Distance to airports, hospitals, fire stations, police, fuel | OSM via Overpass API |
| Hazard | Proximity to water bodies, terrain profile | OSM + elevation proxy |
| Geocoding | Human-readable address, country, admin regions | Nominatim |

Each provider response is tagged with a **data confidence label**:
- `API Data` — directly from a real API call
- `Proxy Estimate` — calculated or inferred, not directly measured
- `Manual Assessment Required` — unavailable from public APIs; must be user-provided

### 1.3 Step 3 — Scoring Engine

The Scoring Engine applies a **weighted multi-factor model** to produce:
- Category scores (0–100 per category)
- A composite **Site Suitability Score** (0–100)

#### Category Weights (configurable in `rules/scoring-weights.ts`)

| Category | Default Weight | Notes |
|---|---|---|
| Natural Hazards | 30% | Seismic, flood, wind, heat proxy |
| Logistics & Accessibility | 20% | Road, emergency services, airport |
| Climate Suitability | 20% | Temperature, humidity, cooling impact |
| Infrastructure Proximity | 15% | Grid, telecom, fiber (proxy) |
| Operational Context | 15% | Urban density, land use proxy |

**Total must equal 100%.**

#### Factor Scoring (within each category)

Each factor score is computed as:

```
factor_score = clamp(raw_value_to_scale(metric, thresholds), 0, 100)
composite_category_score = Σ(factor_weight × factor_score)
```

Example: Airport Distance (within Logistics category)
- < 2 km → 0 (very high risk)
- 2–5 km → 40 (high caution)
- 5–10 km → 70 (moderate)
- > 10 km → 100 (acceptable)

Thresholds are defined in `rules/thresholds.ts` and documented in each explanation card.

### 1.4 Step 4 — Explanation Generation

For every score, the `ExplanationService` generates:

```typescript
interface ExplanationCard {
  metricId: string
  title: string
  value: string           // "1,450 m" or "Moderate"
  score: number           // 0–100
  category: string
  importance: string      // Why it matters for data centers
  interpretation: string  // What this specific value means
  confidenceLevel: ConfidenceLevel
  dataSource: string
  limitations: string[]
  mitigationNote?: string
  thresholds: ThresholdTable
}
```

### 1.5 Step 5 — Composite Score and Verdict

```
Site Suitability Score = Σ(category_weight × category_score)
```

Score interpretation:

| Range | Label | Description |
|---|---|---|
| 80–100 | Excellent | Strong site candidate |
| 65–79 | Good | Viable with noted considerations |
| 50–64 | Moderate | Viable but with significant mitigations needed |
| 35–49 | Challenging | High hurdles; specialist review essential |
| 0–34 | Poor | Multiple high-risk factors present |

---

## 2. Planning Recommendation Methodology

### 2.1 Inputs

The user provides:

| Input | Type | Notes |
|---|---|---|
| White space area | m² | Core computer room area |
| Workload type | enum | General IT / HPC / AI-GPU / Mixed |
| Rack density | kW/rack | e.g. 5, 10, 15, 20+ |
| Availability target | Tier-like | N / N+1 / 2N |
| Growth horizon | years | 3 / 5 / 10 |
| Sustainability priority | Low/Medium/High | Influences cooling recommendation |
| Water usage sensitivity | Low/Medium/High | Influences cooling recommendation |
| Manual overrides | optional | Grid quality, geotechnical input |

### 2.2 Space Allocation

Space allocation is produced as **ranges**, not single values. It depends on workload, density, and redundancy configuration.

**White Space Multiplier Range:**

| Configuration | Typical Gross/Net Multiplier |
|---|---|
| N redundancy, low density, air cooling | 2.3× – 2.8× |
| N+1 redundancy, medium density, CRAC/CRAH | 2.8× – 3.5× |
| 2N redundancy, medium density, chilled water | 3.5× – 4.5× |
| 2N, high density, liquid cooling | 3.0× – 4.0× |

**Output space categories (all shown as ranges with notes):**

| Category | Typical % of gross area |
|---|---|
| White Space | Base input |
| Electrical (Switchgear, MV/LV) | 8–14% |
| UPS / Battery / PDU | 6–12% |
| Mechanical / Cooling | 12–22% |
| Telecom / MDA / HDA | 4–8% |
| Staging / Storage / Service | 5–10% |
| Operations / Security / NOC / Lobby | 4–8% |
| Circulation / Reserve | 10–15% |

### 2.3 Cooling Recommendation Engine

The cooling recommendation is a conditional decision tree:

```
IF rack_density > 20 kW → Liquid cooling oriented (direct liquid, immersion)
ELSE IF rack_density > 12 kW OR workload == AI_HPC → Hybrid or liquid-assist
ELSE IF it_load_kw > 500 kW AND climate moderate → Chilled water approach
ELSE IF it_load_kw > 150 kW → CRAC/CRAH air approach
ELSE → Basic air cooling

PLUS:
IF hotspot_zones expected AND primary != liquid → Add supplemental recommendation

MODIFIED BY:
- sustainability_priority: HIGH → favor economizer-capable approaches
- water_sensitivity: HIGH → avoid evaporative / wet cooling
- climate: hot AND humid → factor in additional mechanical cost note
```

### 2.4 Electrical / Utility Planning

Conceptual electrical recommendations based on:
- IT load estimate (rack count × avg density)
- Redundancy target
- Site utility assessment (proxy from scoring phase)

Output is conceptual planning guidance, not an engineered specification.

### 2.5 Mitigation Recommendations

Each high-risk or warning-flagged factor generates a mitigation card:
- What the risk is
- Why it matters
- Recommended investigation or action
- Whether it changes site viability

---

## 3. Confidence Framework

| Level | Meaning |
|---|---|
| High | Primary metric from real API data with low uncertainty |
| Medium | Derived from real data with moderate estimation |
| Low | Significant proxy or estimation involved |
| Manual Only | Cannot be evaluated without expert input |

The composite score confidence is the **lowest** confidence level among the three highest-weighted factors.

---

## 4. Demo Scenario Methodology

Five canonical demo scenarios are pre-seeded with realistic synthetic data:

| Scenario | City Context | Key Teaching Points |
|---|---|---|
| Cool Climate Metro | Northern European city | Good climate efficiency, high land cost, excellent infrastructure |
| Hot Dry Inland | Middle Eastern inland city | Cooling challenge, grid caution, minimal flood risk |
| Coastal Flood Risk | South Asian coastal city | Flood proxy risk, excellent logistics, climate risk |
| Seismic Dense City | Pacific Ring city | Seismic risk, excellent logistics, manual assessment needed |
| Remote Logistics Challenge | Central African inland | Poor POI access, excellent climate, infrastructure gaps |

---

## 5. Educational Design Principles

1. **Inspect Everything** — every number is clickable to see its derivation
2. **Confidence First** — confidence levels are prominent, not hidden
3. **No False Precision** — ranges and approximations are explicit
4. **Comparative Learning** — side-by-side comparison reinforces factor trade-offs
5. **Scenario Exploration** — pre-built scenarios teach without needing API setup

---

*Last updated: 2026-03-19 | DC SiteLab v1.0*
