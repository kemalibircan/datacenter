// Demo Scenarios configuration for the features/scenarios domain
import type { DemoScenario } from "@/types/domain";

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "frankfurt",
    slug: "cool-climate-metro",
    label: "Frankfurt, Germany",
    description: "Cool Climate Metro",
    coordinates: { lat: 50.11, lng: 8.68 },
    highlights: ["Cool temperate climate", "Excellent logistics", "High land cost"],
    teachingPoints: [
      "Moderate climate allows economizer-enabled cooling strategies",
      "Airport proximity (12 km) needs review for height restrictions",
      "Dense European metro — permitting and land cost are key considerations",
    ],
  },
  {
    id: "dubai",
    slug: "hot-dry-inland",
    label: "Dubai, UAE",
    description: "Hot Dry Inland Site",
    coordinates: { lat: 25.2, lng: 55.27 },
    highlights: ["Extreme heat", "Very low flood risk", "Strong logistics"],
    teachingPoints: [
      "120+ hot days/year drives up cooling CAPEX and OPEX significantly",
      "Excellent logistics and road access are positives",
      "Water sensitivity is high — dry cooling or liquid cooling may be preferred",
    ],
  },
  {
    id: "mumbai",
    slug: "coastal-flood-risk",
    label: "Mumbai, India",
    description: "Coastal Flood Risk Site",
    coordinates: { lat: 19.08, lng: 72.88 },
    highlights: ["Very high flood risk", "Tropical climate", "Excellent urban access"],
    teachingPoints: [
      "Low elevation (8m) near coast — very high flood risk proxy",
      "Monsoon season brings extreme precipitation — drainage and slab design critical",
      "Urban logistics and access are excellent but land is constrained",
    ],
  },
  {
    id: "tokyo",
    slug: "seismic-dense-city",
    label: "Tokyo, Japan",
    description: "Seismic Dense City",
    coordinates: { lat: 35.68, lng: 139.69 },
    highlights: ["Very high seismic risk", "Excellent emergency services", "Dense urban core"],
    teachingPoints: [
      "Pacific Ring of Fire — seismic design is a mandatory and costly requirement",
      "Typhoon exposure adds to wind/storm design requirements",
      "World-class urban logistics but land is expensive and constrained",
    ],
  },
  {
    id: "nairobi",
    slug: "remote-logistics-challenge",
    label: "Nairobi, Kenya",
    description: "Remote Logistics Challenge",
    coordinates: { lat: -1.29, lng: 36.82 },
    highlights: ["Excellent climate (1795m altitude)", "Limited emergency services", "Infrastructure gaps"],
    teachingPoints: [
      "High altitude (1795m) gives naturally cool climate — great for cooling strategy",
      "Infrastructure gaps (power, fiber) require extensive manual assessment",
      "Logistics and emergency services are more limited — operational OPEX implications",
    ],
  },
];
