# DC SiteLab — Architecture

## Overview

DC SiteLab is a Next.js educational web application using the App Router pattern with a clean domain-driven architecture. It is designed to be:

- **Provider-agnostic**: all external data sources are abstracted behind interfaces
- **Mock-first**: the application runs fully in mock mode when APIs are unavailable
- **Explainability-first**: every score or recommendation surfaces its reasoning
- **Configurable**: weights, thresholds, and rules live in dedicated config files

---

## High-Level Architecture

```
┌─────────────────────────────────────────┐
│             Next.js App (App Router)     │
│                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────┐  │
│  │  Pages   │  │   API    │  │  UI  │  │
│  │(app/...)│  │ Routes   │  │ Lib  │  │
│  └────┬─────┘  └────┬─────┘  └──────┘  │
│       │             │                   │
│  ┌────▼─────────────▼──────────────┐   │
│  │          Feature Services        │   │
│  │  (analysis, scoring, planning)   │   │
│  └────────────────┬────────────────┘   │
│                   │                     │
│  ┌────────────────▼──────────────────┐  │
│  │        Provider Abstraction Layer  │  │
│  │  (geocoding, climate, POI, etc.)   │  │
│  └──────┬──────────────────┬─────────┘  │
│         │                  │            │
│   ┌─────▼────┐      ┌──────▼──────┐    │
│   │  Real    │      │    Mock     │    │
│   │ Providers│      │  Providers  │    │
│   └──────────┘      └─────────────┘    │
└─────────────────────────────────────────┘
           │
    ┌──────▼──────┐
    │  PostgreSQL  │
    │  (Prisma)    │
    └─────────────┘
```

---

## Directory Structure

```
dc-sitelab/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── (analysis)/
│   │   ├── analyze/
│   │   │   └── page.tsx          # Map + site selection
│   │   ├── results/[id]/
│   │   │   └── page.tsx          # Analysis results
│   │   └── plan/[id]/
│   │       └── page.tsx          # Planning input + output
│   ├── compare/
│   │   └── page.tsx              # Side-by-side comparison
│   ├── scenarios/
│   │   └── page.tsx              # Demo scenario browser
│   └── api/
│       ├── analyze/route.ts      # Site analysis endpoint
│       ├── plan/route.ts         # Planning endpoint
│       └── compare/route.ts      # Comparison endpoint
│
├── components/                   # Reusable UI components
│   ├── ui/                       # shadcn/ui base components
│   ├── layout/                   # Header, Footer, Sidebar
│   ├── map/                      # Map, Marker, Globe
│   ├── charts/                   # Climate charts, score charts
│   ├── analysis/                 # MetricCard, ScoreGauge, RiskBadge
│   ├── planning/                 # PlanningForm, RecommendationCard
│   └── shared/                   # Confidence badge, etc.
│
├── features/                     # Domain-specific feature modules
│   ├── analysis/                 # Analysis orchestration
│   ├── planning/                 # Planning orchestration
│   ├── comparison/               # Comparison logic
│   └── scenarios/                # Demo scenario definitions
│
├── services/                     # Business logic services
│   ├── analysis.service.ts       # Orchestrates data fetching + scoring
│   ├── planning.service.ts       # Planning recommendation logic
│   ├── scoring.service.ts        # Calls rules engine
│   └── explanation.service.ts   # Generates explanation text
│
├── providers/                    # External data provider adapters
│   ├── interfaces/               # Provider interface definitions
│   │   ├── geocoding.provider.ts
│   │   ├── climate.provider.ts
│   │   ├── elevation.provider.ts
│   │   ├── poi.provider.ts
│   │   └── hazard.provider.ts
│   ├── real/                     # Real API implementations
│   │   ├── nominatim.ts
│   │   ├── open-meteo.ts
│   │   ├── open-elevation.ts
│   │   └── overpass.ts
│   ├── mock/                     # Mock implementations
│   │   ├── mock-geocoding.ts
│   │   ├── mock-climate.ts
│   │   ├── mock-elevation.ts
│   │   ├── mock-poi.ts
│   │   └── mock-hazard.ts
│   └── registry.ts               # Provider selection logic
│
├── rules/                        # Rule engine configuration
│   ├── scoring-weights.ts        # Category and factor weights
│   ├── thresholds.ts             # Risk and performance thresholds
│   ├── cooling-rules.ts          # Cooling recommendation rules
│   ├── planning-rules.ts         # Space allocation rules
│   └── explanations.ts          # Explanation text templates
│
├── lib/                          # Shared utilities
│   ├── utils.ts
│   ├── constants.ts
│   ├── geo.ts                    # Geo utilities
│   └── formatting.ts
│
├── types/                        # TypeScript type definitions
│   ├── domain.ts                 # Core domain types
│   ├── providers.ts              # Provider DTOs
│   ├── scoring.ts                # Scoring types
│   └── planning.ts               # Planning types
│
├── store/                        # Zustand state management
│   ├── analysis.store.ts
│   ├── planning.store.ts
│   └── comparison.store.ts
│
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
└── docs/
    ├── domain-rules.md
    ├── architecture.md
    ├── methodology.md
    └── assumptions-and-limitations.md
```

---

## Provider Abstraction

All external data acquisition is isolated behind a provider interface. Services never call APIs directly.

```typescript
// Example: Elevation Provider Interface
interface ElevationProvider {
  getElevation(lat: number, lng: number): Promise<ElevationResult>
}

// Real implementation
class OpenElevationProvider implements ElevationProvider { ... }

// Mock implementation
class MockElevationProvider implements ElevationProvider { ... }
```

The `providers/registry.ts` selects which implementation to use based on:
1. `NEXT_PUBLIC_MOCK_MODE=true` env flag
2. Missing API key → falls back to mock automatically
3. API error → graceful fallback with reduced confidence

---

## Service Layer

Services coordinate providers and apply domain rules:

```
AnalysisService
  └─ calls: GeocodingProvider, ElevationProvider, ClimateProvider
            POIProvider, HazardProvider
  └─ runs:  ScoringService (via rules engine)
  └─ runs:  ExplanationService
  └─ returns: SiteAnalysisResult
```

Services are pure TypeScript — no React dependencies.

---

## Rule Engine

Rules live in `rules/` and are treated as configuration:

- `scoring-weights.ts` — factor weights (must sum to 1.0 per category)
- `thresholds.ts` — numeric thresholds for risk levels
- `cooling-rules.ts` — conditional cooling recommendation tree
- `planning-rules.ts` — space allocation logic with ranges

This allows domain experts to adjust rules without touching application logic.

---

## Database (Prisma + PostgreSQL)

Core models:

| Model | Purpose |
|---|---|
| `SavedAnalysis` | Persisted site analysis result |
| `PlanningScenario` | Planning inputs + outputs |
| `ComparisonSet` | 2-3 saved analyses linked for comparison |
| `CachedProviderResponse` | Raw API responses cached by location+provider |
| `DemoScenario` | Pre-seeded demo city scenarios |

Auth is optional for MVP. Anonymous sessions use client-side state.

---

## State Management

| Layer | Tool |
|---|---|
| Server state / fetching | Next.js server components + route handlers |
| Client UI state | Zustand stores |
| Form state | React Hook Form + Zod |
| Persistence | Prisma / PostgreSQL |

---

## Data Flow

```
User selects location on map
  → AnalysisService called (server action or API route)
  → Providers fetch: elevation, climate, POI distances, climate data
  → ScoringService applies weighted rules to raw data
  → ExplanationService generates human-readable cards
  → SiteAnalysisResult returned to client
  → Displayed in analysis panel, metric cards, charts
  → User optionally saves result to DB
  → User optionally proceeds to PlanningService
```

---

## Mock Mode

Set `NEXT_PUBLIC_MOCK_MODE=true` (or leave API keys blank).

Mock providers return realistic seeded data for the demo scenario cities. The UI shows a subtle "Demo Mode" banner. All features remain functional.

---

## Deployment

| Component | Target |
|---|---|
| Next.js app | Vercel |
| PostgreSQL | Supabase or Neon |
| Environment variables | Vercel Dashboard |

---

*Last updated: 2026-03-19 | DC SiteLab v1.0*
