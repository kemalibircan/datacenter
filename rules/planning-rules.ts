// Planning rules - space allocation logic with ranges
import type { PlanningInput, SpaceAllocation, ElectricalConcept } from "@/types/domain";
import type { Lang } from "@/lib/i18n";

// Gross-to-net multiplier ranges by configuration
export function getGrossToNetMultiplier(input: PlanningInput): { min: number; max: number } {
  const { availabilityTier, rackDensityKw } = input;

  if (availabilityTier === "2N") {
    return rackDensityKw >= 15 ? { min: 3.0, max: 4.0 } : { min: 3.5, max: 4.5 };
  } else if (availabilityTier === "N+1") {
    return rackDensityKw >= 15 ? { min: 2.8, max: 3.5 } : { min: 2.8, max: 3.8 };
  } else {
    return { min: 2.3, max: 2.8 };
  }
}

export function estimateRackCount(whiteSpaceM2: number, rackDensityKw: number): number {
  const rackBayM2 = 3.5;
  return Math.floor(whiteSpaceM2 / rackBayM2);
}

export function estimateITLoadKw(whiteSpaceM2: number, rackDensityKw: number): number {
  const racks = estimateRackCount(whiteSpaceM2, rackDensityKw);
  const utilizationFactor = 0.75;
  return racks * rackDensityKw * utilizationFactor;
}

export interface SpaceAllocationConfig {
  category: string;
  minPct: number;
  maxPct: number;
  notes: string;
}

export function getSpaceAllocationConfigs(input: PlanningInput, lang: Lang = "en"): SpaceAllocationConfig[] {
  const { availabilityTier, rackDensityKw } = input;
  const isHighRedundancy = availabilityTier === "2N";
  const isHighDensity = rackDensityKw >= 15;

  if (lang === "tr") {
    return [
      {
        category: "Elektrik Destek (Anahtarlama, OG/AG, Dağıtım)",
        minPct: 8,
        maxPct: isHighRedundancy ? 14 : 11,
        notes: isHighRedundancy
          ? "2N yedeklilik, çoğaltılmış elektrik dağıtım yolları ve ek anahtarlama alanı gerektirir."
          : "Tek veya N+1 elektrik yolu. OG/AG paneller, kablo kanalları ve dağıtım panoları için alan.",
      },
      {
        category: "UPS / Akü / PDU Odası",
        minPct: isHighRedundancy ? 10 : 6,
        maxPct: isHighRedundancy ? 14 : 10,
        notes: isHighRedundancy
          ? "2N UPS yapılandırması akü odası gereksinimlerini iki katına çıkarır. Yer tasarrufu için lityum-iyon düşünülebilir."
          : "UPS üniteleri ve akü dizileri için alan. N+1 veya N yapılandırması.",
      },
      {
        category: "Mekanik / Soğutma Tesisi",
        minPct: isHighDensity ? 14 : 12,
        maxPct: isHighDensity ? 22 : 18,
        notes: isHighDensity
          ? "Yüksek yoğunluklu kurulumlar daha büyük soğutma altyapısı gerektirir — sıvı soğutma dağıtımı, CDU odaları ve muhtemelen ek soğutucu kapasitesi."
          : "Hava işleme üniteleri, CRAC/CRAH veya soğuk su dağıtımı, soğutma kuleleri veya kondansatörler.",
      },
      {
        category: "Telekomünikasyon / MDA / HDA / Kablolama Altyapısı",
        minPct: 4,
        maxPct: 8,
        notes: "Buluşma noktası odası (MMR), ana dağıtım alanı (MDA), yatay dağıtım alanları (HDA), kablo yönetimi.",
      },
      {
        category: "Hazırlık / Depo / Yükleme / Servis Alanları",
        minPct: 5,
        maxPct: 10,
        notes: "Teslimat iskelesi, BT ekipmanı hazırlama alanı, yedek parça depolama, ekipman yetkisiz kullanım dışı bırakma.",
      },
      {
        category: "Operasyon / Güvenlik / NOC / Lobi / Yönetim",
        minPct: 4,
        maxPct: 8,
        notes: "Ağ operasyon merkezi (NOC), erişim kontrolü, güvenlik masası, ziyaretçi lobisi, küçük idari ofisler.",
      },
      {
        category: "Sirkülasyon / Koridorlar / Yapısal Rezerv / Bakım Alanı",
        minPct: 10,
        maxPct: 15,
        notes: "Yapısal kolonlar, servis koridorları, yangın çıkış koridorları, bakım boşlukları. Bu alanı aşırı sıkıştırmayın.",
      },
    ];
  }

  // English (default)
  return [
    {
      category: "Electrical Support (Switchgear, MV/LV, Distribution)",
      minPct: 8,
      maxPct: isHighRedundancy ? 14 : 11,
      notes: isHighRedundancy
        ? "2N redundancy requires duplicated electrical distribution paths and additional switchgear space."
        : "Single or N+1 electrical path. Space for MV/LV panels, cable trays, and distribution boards.",
    },
    {
      category: "UPS / Battery / PDU Room",
      minPct: isHighRedundancy ? 10 : 6,
      maxPct: isHighRedundancy ? 14 : 10,
      notes: isHighRedundancy
        ? "2N UPS configuration doubles battery room requirements. Consider lithium-ion for space reduction."
        : "Room for UPS units and battery strings. N+1 or N configuration.",
    },
    {
      category: "Mechanical / Cooling Plant",
      minPct: isHighDensity ? 14 : 12,
      maxPct: isHighDensity ? 22 : 18,
      notes: isHighDensity
        ? "High-density deployments require greater cooling infrastructure — liquid cooling distribution, CDU rooms, possibly more chiller capacity."
        : "Air handling units, CRAC/CRAH or chilled water distribution, cooling towers or condensers (if outdoor suitable).",
    },
    {
      category: "Telecom / MDA / HDA / Cabling Infrastructure",
      minPct: 4,
      maxPct: 8,
      notes: "Meet-me room (MMR), main distribution area (MDA), horizontal distribution areas (HDA), cable management.",
    },
    {
      category: "Staging / Storage / Loading / Service Areas",
      minPct: 5,
      maxPct: 10,
      notes: "Receiving dock, IT equipment staging, spare parts storage, decommission staging.",
    },
    {
      category: "Operations / Security / NOC / Lobby / Admin",
      minPct: 4,
      maxPct: 8,
      notes: "Network operations center (NOC), access control, security desk, visitor lobby, possibly small admin offices.",
    },
    {
      category: "Circulation / Aisles / Structural Reserve / Maintainability",
      minPct: 10,
      maxPct: 15,
      notes: "Structural columns, service aisles, fire egress corridors, maintainability clearances. Do not over-compress this.",
    },
  ];
}

export function computeSpaceAllocations(
  input: PlanningInput,
  grossM2Min: number,
  grossM2Max: number,
  lang: Lang = "en"
): SpaceAllocation[] {
  const configs = getSpaceAllocationConfigs(input, lang);

  return configs.map((c) => ({
    category: c.category,
    minM2: Math.round((c.minPct / 100) * grossM2Min),
    maxM2: Math.round((c.maxPct / 100) * grossM2Max),
    notes: c.notes,
    percentOfGross: { min: c.minPct, max: c.maxPct },
  }));
}

export function buildElectricalConcept(
  input: PlanningInput,
  estimatedITLoadKw: number,
  lang: Lang = "en"
): ElectricalConcept {
  const pueRange = {
    N: { min: 1.4, max: 1.8 },
    "N+1": { min: 1.5, max: 1.9 },
    "2N": { min: 1.6, max: 2.0 },
  }[input.availabilityTier];

  const redundancyNotes: Record<string, Record<string, string>> = {
    en: {
      N: "N configuration: no redundancy. Any single failure in critical path results in downtime. Appropriate only for non-critical or development workloads.",
      "N+1": "N+1 configuration: one unit of backup capacity in each critical system path. Industry standard for most production data centers.",
      "2N": "2N configuration: fully redundant dual paths throughout. Highest resilience but approximately doubles critical infrastructure investment.",
    },
    tr: {
      N: "N yapılandırması: yedeklilik yok. Kritik yoldaki herhangi bir tek arıza kesintiye neden olur. Yalnızca kritik olmayan veya geliştirme iş yükleri için uygundur.",
      "N+1": "N+1 yapılandırması: her kritik sistem yolunda bir yedek kapasite birimi. Çoğu üretim veri merkezi için endüstri standardı.",
      "2N": "2N yapılandırması: boydan boya tam yedekli çift yollar. En yüksek dayanıklılık ancak kritik altyapı yatırımını yaklaşık olarak iki katına çıkarır.",
    },
  };

  const utilityNote = lang === "tr"
    ? "Şebeke bağlantısı kalitesi ve kapasitesi, yerel elektrik sağlayıcısıyla manuel değerlendirme yoluyla doğrulanmalıdır. Bu, kamuya açık verilerden onaylanamaz."
    : "Utility connection quality and capacity must be verified through manual assessment with the local utility provider. This cannot be confirmed from public data.";

  const warnings = lang === "tr"
    ? [
        "Kesin elektrik tasarımı için lisanslı elektrik mühendisi tarafından yük akış analizi gereklidir.",
        "Şebeke kapasitesi ve hizmet bağlantısı fizibilitesi elektrik sağlayıcısıyla teyit edilmelidir.",
        "Jeneratör boyutlandırması, transfer süreleri ve yakıt depolaması bu kavramsal tahmine dahil değildir.",
      ]
    : [
        "Exact electrical design requires load flow analysis by a licensed electrical engineer.",
        "Grid capacity and utility connection feasibility must be confirmed with the utility provider.",
        "Generator sizing, transfer times, and fuel storage are not included in this conceptual estimate.",
      ];

  return {
    estimatedITLoadKw: Math.round(estimatedITLoadKw),
    estimatedTotalLoadKw: {
      min: Math.round(estimatedITLoadKw * pueRange.min),
      max: Math.round(estimatedITLoadKw * pueRange.max),
    },
    redundancyNote: redundancyNotes[lang][input.availabilityTier],
    utilityNote,
    conceptualConfig: `Estimated IT load: ~${Math.round(estimatedITLoadKw)} kW | Conceptual total with PUE overhead: ~${Math.round(estimatedITLoadKw * pueRange.min)}–${Math.round(estimatedITLoadKw * pueRange.max)} kW | Redundancy: ${input.availabilityTier}`,
    warnings,
  };
}
