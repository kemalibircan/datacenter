# DC SiteLab

**An Educational Data Center Site Selection & Concept Planning Simulator**

> ⚠️ **Not certified engineering software.** DC SiteLab is an educational tool for learning the logic of data center site selection. Outputs are educational approximations only and must not be used for real capital investment decisions without independent expert review.

---

## What Is This?

DC SiteLab is a full-stack Next.js web application that teaches:

- **Multi-factor site selection** — how to evaluate a location across natural hazards, climate, logistics, and infrastructure
- **Risk scoring with explainability** — every score has a breakdown with confidence levels and limitations
- **Concept planning** — how white space drives facility sizing, cooling strategy, and electrical planning
- **Trade-off awareness** — how different decisions (redundancy, density, cooling) change the planning outcome

Built for engineering students, trainees, and early-stage planners.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 with App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Maps | MapLibre GL JS + OpenStreetMap tiles |
| Charts | Recharts |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Database | PostgreSQL + Prisma |
| Deployment | Vercel (app) + Supabase/Neon (DB) |

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp env.example .env.local

# 3. The app runs in Demo Mode by default (NEXT_PUBLIC_MOCK_MODE=true)
#    No API keys or database required for demo mode.

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Demo Mode

The app ships with 5 pre-built demo scenarios that work without any API keys or database:

| Scenario | Location | Key Teaching Points |
|---|---|---|
| Cool Climate Metro | Frankfurt, Germany | Climate efficiency, airport proximity |
| Hot Dry Inland | Dubai, UAE | Heat stress, cooling challenge |
| Coastal Flood Risk | Mumbai, India | Flood risk, monsoon precipitation |
| Seismic Dense City | Tokyo, Japan | Seismic risk, urban constraints |
| Remote Logistics | Nairobi, Kenya | High altitude, infrastructure gaps |

---

## Using Real APIs

Set `NEXT_PUBLIC_MOCK_MODE=false` in `.env.local` to enable real provider calls.

All providers used are **free, open-data APIs** — no commercial API keys required:

| Provider | Used For | Key Required? |
|---|---|---|
| Nominatim (OSM) | Geocoding | No |
| Open-Elevation | Elevation | No |
| Open-Meteo | 10-year climate data | No |
| Overpass API | POI proximity (airports, hospitals, etc.) | No |

Set `NOMINATIM_USER_AGENT` in `.env.local` to a descriptive string (required by OSM usage policy).

---

## Database Setup (Optional)

The app works without a database in demo mode. For full persistence:

```bash
# Set DATABASE_URL in .env.local
# Then generate and apply the Prisma schema:
npx prisma generate
npx prisma db push
```

Use [Supabase](https://supabase.com) or [Neon](https://neon.tech) for a free hosted PostgreSQL.

---

## Project Structure

```
app/                    # Next.js App Router pages + API routes
components/             # React UI components
  analysis/             # AnalysisPanel, metric cards
  charts/               # ClimateChart (Recharts)
  layout/               # NavBar
  map/                  # MapSelector (MapLibre)
  shared/               # ConfidenceBadge, ScoreGauge
  ui/                   # shadcn/ui primitives
features/
  scenarios/            # Demo scenario configuration
providers/
  interfaces.ts         # Provider interface contracts
  mock/                 # Mock providers (demo mode)
  real/                 # Real API providers
  registry.ts           # Provider selector
rules/
  scoring-weights.ts    # Category and factor weights
  thresholds.ts         # Risk thresholds and breakpoints
  cooling-rules.ts      # Cooling recommendation logic
  planning-rules.ts     # Space allocation logic
services/
  analysis.service.ts   # Orchestrates site analysis
  scoring.service.ts    # Scoring engine
  explanation.service.ts# Explanation card generator
  planning.service.ts   # Planning recommendation engine
store/                  # Zustand state stores
types/                  # TypeScript domain types
prisma/                 # Prisma schema
docs/                   # Architecture & methodology docs
```

---

## Methodology & Assumptions

See [`docs/`](./docs/) for:
- [`domain-rules.md`](./docs/domain-rules.md) — Engineering domain rules
- [`architecture.md`](./docs/architecture.md) — System architecture
- [`methodology.md`](./docs/methodology.md) — Scoring and planning methodology
- [`assumptions-and-limitations.md`](./docs/assumptions-and-limitations.md) — What this app cannot do

---

## Deployment (Vercel)

```bash
# Build
npm run build

# Deploy via Vercel CLI
vercel deploy
```

Set these environment variables in the Vercel dashboard:
- `DATABASE_URL` — your production PostgreSQL URL
- `NEXT_PUBLIC_MOCK_MODE` — `false` for production, `true` for demo-only
- `NOMINATIM_USER_AGENT` — your app's user agent string

---

## Contributing / Extending

The app is designed to be extensible:

- **New scoring factors**: Add to `rules/scoring-weights.ts` and `rules/thresholds.ts`, then add scoring logic in `services/scoring.service.ts`
- **New data providers**: Implement the interface from `providers/interfaces.ts`, add to `providers/real/`, register in `providers/registry.ts`
- **New planning rules**: Modify `rules/planning-rules.ts` or `rules/cooling-rules.ts`

---

*DC SiteLab v1.0 | Educational use only*
