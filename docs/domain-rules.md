# DC SiteLab — Domain Rules

> This document defines the engineering and domain logic that governs all scoring, recommendation, and planning outputs in DC SiteLab.
> It is the primary reference for all rule engine implementations.

---

## 1. Multi-Factor Site Selection

A data center site must never be selected based on a single variable. The evaluation must consider all of the following factor categories:

| Category | Examples |
|---|---|
| Natural hazards | Seismic risk, flood risk, wind/storm exposure, wildfire, heat stress |
| Environmental conditions | Climate, elevation, terrain, geotechnical suitability |
| Man-made hazards | Proximity to airports, industrial zones, high-density urban zones |
| Accessibility / Logistics | Major road access, emergency services, staging/delivery access |
| Utility / Service availability | Power grid proximity, telecom/fiber proximity, fuel access |
| Regulations / Context | Land use, zoning context, environmental constraints |

**Rule:** No single category score should dominate the final composite score unless configured explicitly with documented justification.

---

## 2. Risk Assessment Logic

Risk is modeled using a probability × impact style framework, normalized to a 0–100 scale.

Each risk factor produces:
- **Category score** (0–100, higher is better / safer)
- **Human-readable explanation** of what was evaluated
- **Penalty or warning flag** if threshold is exceeded
- **Mitigation note** describing recommended actions
- **Confidence level** (High / Medium / Low / Estimated)

Risk outputs must always be explainable. Opaque black-box scores are not acceptable.

---

## 3. Natural Hazard Categories

The system evaluates the following natural hazards via public data or proxy indicators:

### 3.1 Seismic Risk
- Source: OpenStreetMap hazard overlays or proxy by geographic region
- Evaluation: proximity to known fault zones, regional seismic zone classification
- **Limitation:** Exact seismic microzonation requires expert geotechnical assessment — can only be estimated here
- Label: `Proxy Estimate`

### 3.2 Flood Risk
- Source: Terrain elevation from Open-Elevation, proximity to water bodies from OSM
- Evaluation: low elevation + proximity to river/coast = higher risk
- **Limitation:** FEMA-grade flood zone data cannot be assumed available globally
- Label: `Proxy Estimate`

### 3.3 Wind / Storm Exposure
- Source: Climate zone classification derived from latitude, historical weather data
- Evaluation: exposure index based on climate zone, distance from coast
- Label: `Proxy Estimate`

### 3.4 Heat Stress / Extreme Climate
- Source: Open-Meteo historical temperature averages
- Evaluation: average summer temperature, number of extreme heat days per year
- Used for cooling strategy input
- Label: `API Data`

### 3.5 Wildfire Proxy
- Source: Climate zone + vegetation context (dry/semi-arid)
- **Limitation:** Real wildfire risk data requires specialized datasets — approximated from climate zone
- Label: `Proxy Estimate`

### 3.6 Terrain / Elevation Concerns
- Source: Open-Elevation API
- Evaluation: absolute elevation, terrain suitability for construction
- Very high or very low elevation noted as a concern
- Label: `API Data`

### 3.7 Geotechnical Suitability
- **Rule:** Must NOT be treated as exact unless expert manual input is provided.
- App presents a qualitative note based on terrain and elevation data only.
- Source: Manual expert input or regional proxy
- Label: `Manual Assessment Required`

---

## 4. Man-Made / Operational Concerns

### 4.1 Airport Proximity
- Nearby airports create: noise, avigation easements, height restrictions, crane restrictions
- Typically negative for data center siting within 5 km
- Source: OSM POI (Overpass API)
- Label: `API Data`

### 4.2 Road / Highway Access
- Major road or highway within reasonable distance is positive for logistics, staffing, and emergency response
- Source: OSM Overpass API
- Label: `API Data`

### 4.3 Emergency Service Access
- Hospital, fire station, police proximity is evaluated
- Closer = better resiliency (emergency response time)
- Source: OSM Overpass API
- Label: `API Data`

### 4.4 Fuel Access
- Proximity to fuel supply (petrol stations or industrial fuel) is an operational concern
- Relevant for backup generator fuel supply
- Source: OSM Overpass API
- Label: `API Data`

### 4.5 Urban Density / Operational Context
- Very dense urban core = higher land cost, permitting friction, noise constraints
- Very remote = logistics challenges
- Approximated from POI density in the vicinity
- Label: `Proxy Estimate`

---

## 5. Utility and Infrastructure Limitations

The following items **cannot be precisely determined from public APIs** and must be labeled accordingly:

| Item | Label |
|---|---|
| Grid quality / reliability | `Manual Assessment Required` |
| Utility redundancy | `Manual Assessment Required` |
| Fiber / telecom readiness | `Proxy Estimate` |
| Exact geotechnical suitability | `Manual Assessment Required` |
| Permitting complexity | `Manual Assessment Required` |

The app evaluates rough proximity to infrastructure as a proxy signal, not a confirmed service readiness assessment.

---

## 6. Cost Thinking

Site selection is not only a technical safety exercise. It has significant economic implications.

The app reflects cost thinking conceptually, not as a financial model:

| Cost Dimension | Educational Note |
|---|---|
| CAPEX | Land cost, construction complexity, site preparation |
| OPEX | Energy cost, cooling cost, staff logistics, maintenance |
| Logistics | Remote sites = higher maintenance cost |
| Regulatory | Complex zones = permitting cost and delay |
| Resilience premium | Higher redundancy = higher CAPEX |

---

## 7. White Space Planning Rule

The app must not claim that white space alone determines total facility area.

For a given white space input (e.g., 400 m²), the output must include:
- **Conceptual allocation ranges** for all support categories
- **Dependency notes** on density, cooling strategy, and redundancy level
- **Planning ranges** (not single exact values)
- **Trade-off notes**

**Rule:** A white space multiplier must be presented as a range (e.g., 2.5×–4.5× depending on configuration), never as a fixed ratio.

---

## 8. Conceptual Space Categories

| Category | Notes |
|---|---|
| White Space (Computer Room) | The core server/rack area |
| Electrical Support | Switchgear, MV/LV rooms, distribution |
| UPS / Battery / PDU | Depends on redundancy Tier target |
| Mechanical / Cooling Support | Chillers, CRAC/CRAH, cooling towers, AHUs |
| Telecom / MDA / HDA / Cabling | Meet-me rooms, distribution areas |
| Staging / Storage / Service | Receiving dock, staging, spare parts |
| Operations / Security / Lobby | NOC, security, visitor and admin areas |
| Circulation / Maintainability Reserve | Aisles, overhead, clearances |

---

## 9. Redundancy and Design Trade-offs

| Design Decision | Implication |
|---|---|
| N (no redundancy) | Smallest footprint, lowest cost, highest risk |
| N+1 | Common baseline for non-critical facilities |
| 2N | Full redundancy, approximately doubles critical infrastructure space |
| 2N+1 | Rarely justified; extreme CAPEX |
| Rack density | Higher density → more cooling infrastructure area needed |
| Cooling strategy | Air vs. liquid changes mechanical room ratios significantly |
| Growth horizon | Reserve space must be planned upfront |

**Rule:** Do not hardcode one universal space multiplier ratio. Present a range.

---

## 10. Cooling Recommendation Rules

Cooling recommendations are conditional. The system evaluates:
- Climate zone and outdoor temperature
- Rack density (W/rack)
- Facility scale (kW IT load)
- Workload type
- Sustainability priority
- Water sensitivity

### Recommendation Categories

| Strategy | When it fits |
|---|---|
| Basic air (small IT room / CRAC) | Small load, low density, limited budget, temperate climate |
| CRAC/CRAH air approach | Mid-scale, moderate density, conventional workload |
| Chilled-water approach | Medium–large scale, climate allows efficient operation, cost-effective at scale |
| Hybrid cooling | Mixed density, phased growth, balancing efficiency and flexibility |
| Liquid-cooling oriented | High-density AI/HPC or >20 kW/rack scenarios |
| Supplemental / localized cooling | Dense hotspot zones within an otherwise air-cooled environment |

---

## 11. Chilled Water Guidance

Chilled-water-oriented approaches are generally more suitable when:
- IT load exceeds ~500 kW (as a rough educational threshold)
- Climate permits efficient chiller operation
- Long operational life is planned
- Airside economizer or waterside economizer integration is possible

**Rule:** Not an absolute truth — presented as a conditional recommendation with explanation.

---

## 12. Liquid Cooling Guidance

Liquid cooling or hybrid strategies become more favorable when:
- Rack density exceeds ~15–20 kW/rack
- Workload is AI/HPC or GPU-intensive
- Sustainability or PUE optimization is a priority

The app must explain:
- Higher density suitability reasons
- Operational complexity increase
- Possible efficiency advantages
- Cases where it may be unnecessary overhead

---

## 13. Supplemental Cooling Guidance

Localized supplemental cooling (in-row or overhead) is more appropriate for:
- Specific dense rack zones (hotspots)
- Not as a default whole-facility strategy
- Hybrid deployments with mixed density zones

---

## 14. Climate and Energy Efficiency

The scoring and recommendation logic must reflect:
- Cooler climates → better economizer potential → better cooling efficiency
- Hot/humid climates → more cooling infrastructure investment needed
- Water-scarce regions → avoid evaporative/wet cooling approaches
- Renewable-friendly regions → may influence sustainability scoring (proxy)

---

## 15. Explainability Mandate

**Every major output must include:**
- What was evaluated
- Why it matters for data center siting or planning
- How it influenced the result
- Limitations and assumptions
- Confidence level (High / Medium / Low / Estimated)

The app is an educational training tool. All logic must be transparent and inspectable.

---

## 16. No Fake Precision Rule

If a result depends on missing, estimated, or proxy data, the system must:
- Show a lower confidence indicator
- Display assumptions clearly
- Offer a manual override field where relevant
- Never present an uncertain result as confirmed engineering fact

---

*Last updated: 2026-03-19 | DC SiteLab v1.0 Domain Reference*
