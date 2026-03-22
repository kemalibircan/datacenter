// Cooling recommendation rules - conditional decision tree
import type {
  CoolingRecommendation,
  CoolingStrategy,
  PlanningInput,
  SiteAnalysisResult,
} from "@/types/domain";
import type { Lang } from "@/lib/i18n";

export interface CoolingContext {
  input: PlanningInput;
  analysis: SiteAnalysisResult | null;
  estimatedITLoadKw: number;
  lang?: Lang;
}

interface CoolingRuleResult {
  strategy: CoolingStrategy;
  label: string;
  rationale: string;
  pros: string[];
  cons: string[];
  applicability: string;
  supplementalNote?: string;
}

const COOLING_STRATEGIES_EN: Record<CoolingStrategy, Omit<CoolingRuleResult, "rationale">> = {
  "basic-air": {
    strategy: "basic-air",
    label: "Basic Air Cooling (CRAC / Small Precision AC)",
    pros: ["Simple infrastructure, low CAPEX", "Well-understood technology", "Easy to install and maintain"],
    cons: ["Low density ceiling (~3–5 kW/rack typical)", "Less efficient at scale", "Higher PUE potential"],
    applicability: "Small IT rooms, edge locations, low-density mixed workloads up to ~100 kW IT load",
  },
  "crac-crah": {
    strategy: "crac-crah",
    label: "CRAC / CRAH Air Handling Approach",
    pros: ["Established and proven for mid-scale deployments", "Moderate CAPEX versus chilled water", "Flexible layout options (raised floor or overhead)"],
    cons: ["Efficiency decreases at higher densities", "Less scalable than chilled-water for very large loads"],
    applicability: "Mid-scale facilities, ~100–500 kW IT load, moderate rack density (5–12 kW/rack)",
  },
  "chilled-water": {
    strategy: "chilled-water",
    label: "Chilled Water (CHW) Plant Approach",
    pros: ["High efficiency at scale", "Can integrate economizers (free cooling) in temperate climates", "Better capacity for growth", "Lower long-term OPEX at scale"],
    cons: ["Higher CAPEX for plant and piping infrastructure", "Greater operational complexity", "Water consumption for cooling towers if wet cooling"],
    applicability: "Medium to large facilities, typically > 500 kW IT load, conventional density",
  },
  "hybrid": {
    strategy: "hybrid",
    label: "Hybrid Cooling (Air + Liquid Assist)",
    pros: ["Handles mixed workload density effectively", "Phased investment possible", "Air for low-density zones, liquid for high-density zones"],
    cons: ["Operational complexity managing two systems", "Requires careful zone planning"],
    applicability: "Mixed-density deployments, phased growth, heterogeneous workloads",
  },
  "liquid-cooling": {
    strategy: "liquid-cooling",
    label: "Liquid Cooling Oriented (Direct Liquid / Rear-Door / Immersion)",
    pros: ["Handles very high rack densities (20+ kW/rack)", "Excellent for AI, HPC, GPU workloads", "Potentially very high cooling efficiency", "Can dramatically improve PUE at extreme densities"],
    cons: ["Higher CAPEX and operational complexity", "Requires compatible server hardware", "Less familiar to some operations teams", "May be over-engineered for low-density workloads"],
    applicability: "High-density AI/HPC/GPU deployments, > 15–20 kW/rack",
  },
  "liquid-cooling-plus-supplemental": {
    strategy: "liquid-cooling-plus-supplemental",
    label: "Liquid Cooling + Supplemental Air for Low-Density Zones",
    pros: ["Optimized for mixed density environments", "Liquid for hotspot/dense zones, air for standard zones"],
    cons: ["Most complex cooling scheme", "High CAPEX"],
    applicability: "Large mixed facilities with AI/HPC islands and general IT areas",
  },
};

const COOLING_STRATEGIES_TR: Record<CoolingStrategy, Omit<CoolingRuleResult, "rationale">> = {
  "basic-air": {
    strategy: "basic-air",
    label: "Temel Hava Soğutma (CRAC / Küçük Hassas AC)",
    pros: ["Basit altyapı, düşük sermaye maliyeti", "İyi anlaşılmış teknoloji", "Kurulumu ve bakımı kolay"],
    cons: ["Düşük yoğunluk tavanı (tipik ~3–5 kW/raf)", "Büyük ölçekte daha az verimli", "Daha yüksek PUE potansiyeli"],
    applicability: "Küçük BT odaları, kenar konumlar, ~100 kW IT yüküne kadar düşük yoğunluklu karma iş yükleri",
  },
  "crac-crah": {
    strategy: "crac-crah",
    label: "CRAC / CRAH Hava İşleme Yaklaşımı",
    pros: ["Orta ölçekli kurulumlar için kanıtlanmış", "Soğuk suya kıyasla orta düzey sermaye maliyeti", "Esnek yerleşim seçenekleri (yükseltilmiş zemin veya tavan üstü)"],
    cons: ["Yüksek yoğunluklarda verimlilik düşer", "Çok büyük yükler için soğuk suya göre daha az ölçeklenebilir"],
    applicability: "Orta ölçekli tesisler, ~100–500 kW IT yükü, orta raf yoğunluğu (5–12 kW/raf)",
  },
  "chilled-water": {
    strategy: "chilled-water",
    label: "Soğuk Su (CHW) Tesisi Yaklaşımı",
    pros: ["Büyük ölçekte yüksek verimlilik", "Mutedil iklimlerde ekonomizer (ücretsiz soğutma) entegrasyonu mümkün", "Büyüme için daha iyi kapasite", "Büyük ölçekte uzun vadede düşük işletme maliyeti"],
    cons: ["Tesis ve boru altyapısı için yüksek sermaye maliyeti", "Daha büyük operasyonel karmaşıklık", "Islak soğutma kulelerinde su tüketimi"],
    applicability: "Orta ve büyük tesisler, tipik olarak >500 kW IT yükü, geleneksel yoğunluk",
  },
  "hybrid": {
    strategy: "hybrid",
    label: "Hibrit Soğutma (Hava + Sıvı Destek)",
    pros: ["Karma iş yükü yoğunluğunu etkin şekilde karşılar", "Aşamalı yatırım mümkün", "Düşük yoğunluk bölgeleri için hava, yüksek yoğunluk için sıvı"],
    cons: ["İki sistemi yönetmenin operasyonel karmaşıklığı", "Dikkatli bölge planlaması gerektirir"],
    applicability: "Karma yoğunluklu kurulumlar, aşamalı büyüme, heterojen iş yükleri",
  },
  "liquid-cooling": {
    strategy: "liquid-cooling",
    label: "Sıvı Soğutma Odaklı (Doğrudan Sıvı / Arka Kapı / Daldırma)",
    pros: ["Çok yüksek raf yoğunluklarını karşılar (20+ kW/raf)", "AI, HPC, GPU iş yükleri için mükemmel", "Potansiyel olarak çok yüksek soğutma verimliliği", "Aşırı yoğunluklarda PUE'yi dramatik şekilde iyileştirebilir"],
    cons: ["Yüksek sermaye maliyeti ve operasyonel karmaşıklık", "Uyumlu sunucu donanımı gerektirir", "Bazı operasyon ekiplerine daha az tanıdık", "Düşük yoğunluklu iş yükleri için aşırı mühendislik olabilir"],
    applicability: "Yüksek yoğunluklu AI/HPC/GPU kurulumları, >15–20 kW/raf",
  },
  "liquid-cooling-plus-supplemental": {
    strategy: "liquid-cooling-plus-supplemental",
    label: "Sıvı Soğutma + Düşük Yoğunluk Bölgeleri İçin Ek Hava Soğutma",
    pros: ["Karma yoğunluk ortamları için optimize edilmiş", "Sıcak nokta/yoğun bölgeler için sıvı, standart bölgeler için hava"],
    cons: ["En karmaşık soğutma şeması", "Yüksek sermaye maliyeti"],
    applicability: "AI/HPC adaları ve genel BT alanları bulunan büyük karma tesisler",
  },
};

export function deriveCoolingRecommendation(ctx: CoolingContext): CoolingRecommendation {
  const { input, analysis, estimatedITLoadKw, lang = "en" } = ctx;
  const { rackDensityKw, workloadType, sustainabilityPriority, waterSensitivity } = input;
  const avgTemp = analysis?.climate?.annualAvgTempC ?? 20;
  const hotDays = analysis?.climate?.hotDaysPerYear ?? 30;
  const isTR = lang === "tr";

  let strategy: CoolingStrategy;
  let rationale: string;
  let supplementalNote: string | undefined;

  // Core decision tree
  if (rackDensityKw >= 20 || workloadType === "ai-gpu") {
    strategy = workloadType === "mixed" ? "liquid-cooling-plus-supplemental" : "liquid-cooling";
    if (isTR) {
      rationale = `${rackDensityKw} kW/raf yoğunluğu${workloadType === "ai-gpu" ? " ve AI/GPU iş yükü" : ""} yüksek yoğunluk aralığında olup, hava bazlı yaklaşımların çok üzerinde sıvı soğutmanın güçlü biçimde tercih edildiği bölgedir.`;
      if (workloadType !== "ai-gpu" && workloadType !== "hpc") {
        supplementalNote = "Tüm rafların gerçekten sıvı soğutmaya ihtiyaç duyup duymadığını veya sıvı adacıklarla hibrit yaklaşımın daha uygun maliyetli olup olmadığını değerlendirin.";
      }
    } else {
      rationale = `Rack density of ${rackDensityKw} kW/rack${workloadType === "ai-gpu" ? " with AI/GPU workload" : ""} is in the high-density range where liquid cooling or liquid-assist becomes strongly favorable over air-based approaches.`;
      if (workloadType !== "ai-gpu" && workloadType !== "hpc") {
        supplementalNote = "Consider whether all racks actually require liquid cooling, or if a hybrid approach with liquid islands is more cost-effective.";
      }
    }
  } else if (rackDensityKw >= 12 || workloadType === "hpc") {
    strategy = "hybrid";
    if (isTR) {
      rationale = `${rackDensityKw} kW/raf yoğunluğu${workloadType === "hpc" ? " ve HPC iş yükü" : ""} hibrit soğutmanın (standart bölgeler için hava, yoğun bölgeler için sıvı destek) genellikle en pratik ve uygun maliyetli yaklaşım olduğu bir aralıktadır.`;
      supplementalNote = "Özellikle en yüksek yoğunluklu kabinler için doğrudan sıvı soğutmayı değerlendirin.";
    } else {
      rationale = `Rack density of ${rackDensityKw} kW/rack${workloadType === "hpc" ? " with HPC workload" : ""} sits in a range where hybrid cooling (air for standard zones, liquid-assist for dense zones) is often the most practical and cost-effective approach.`;
      supplementalNote = "Evaluate direct liquid cooling for the highest-density cabinets specifically.";
    }
  } else if (estimatedITLoadKw >= 500) {
    strategy = "chilled-water";
    if (isTR) {
      rationale = `Orta yoğunlukta (${rackDensityKw} kW/raf) tahmini ~${Math.round(estimatedITLoadKw)} kW IT yükü, özellikle büyüme planlandığında soğuk su tesisi yaklaşımının oda seviyesi CRAC/CRAH ünitelerine kıyasla daha iyi uzun vadeli operasyonel verimlilik sunduğu bir aralıktadır.`;
    } else {
      rationale = `Estimated IT load of ~${Math.round(estimatedITLoadKw)} kW at moderate density (${rackDensityKw} kW/rack) is in a range where a chilled water plant approach typically delivers better long-term operational efficiency compared to room-level CRAC/CRAH units, especially with growth planned.`;
    }
  } else if (estimatedITLoadKw >= 100) {
    strategy = "crac-crah";
    if (isTR) {
      rationale = `Orta yoğunlukta tahmini ~${Math.round(estimatedITLoadKw)} kW IT yükü, CRAC/CRAH tarzı hava işleme için tipik bir uyumdur. Bu ölçek için iyi kanıtlanmış bir yaklaşımdır.`;
    } else {
      rationale = `Estimated IT load of ~${Math.round(estimatedITLoadKw)} kW with moderate density is a typical fit for CRAC/CRAH-style air handling. This is a well-proven approach for this scale.`;
    }
  } else {
    strategy = "basic-air";
    if (isTR) {
      rationale = `Tahmini ~${Math.round(estimatedITLoadKw)} kW IT yükü ve ${rackDensityKw} kW/raf yoğunluğu temel hassas iklimlendirme yaklaşımı için uygundur.`;
    } else {
      rationale = `Estimated IT load of ~${Math.round(estimatedITLoadKw)} kW and rack density of ${rackDensityKw} kW/rack is suitable for a basic precision air conditioning approach.`;
    }
  }

  // Climate modifier notes
  if (avgTemp < 12 && (strategy === "chilled-water" || strategy === "crac-crah")) {
    rationale += isTR
      ? ` Sahanın serin ortalama iklimi (yıllık ort. ${avgTemp.toFixed(1)}°C), hava tarafı veya su tarafı ekonomizer entegrasyonu için elverişlidir ve PUE'yi önemli ölçüde iyileştirebilir.`
      : ` The site's cool average climate (${avgTemp.toFixed(1)}°C annual avg) is favorable for airside or waterside economizer integration, potentially improving PUE significantly.`;
  } else if (avgTemp > 30 || hotDays > 60) {
    rationale += isTR
      ? ` Not: Bu sahadaki sıcak iklim (ort. ${avgTemp.toFixed(1)}°C, ${hotDays} sıcak gün/yıl) soğutma altyapısı gereksinimlerini artıracak ve mekanik boyutlandırmada dikkate alınmalıdır.`
      : ` Note: The hot climate at this site (${avgTemp.toFixed(1)}°C avg, ${hotDays} hot days/year) will increase cooling infrastructure requirements and should be accounted for in mechanical sizing.`;
  }

  // Water sensitivity modifier
  if (waterSensitivity === "high" && (strategy === "chilled-water" || strategy === "basic-air")) {
    supplementalNote = (supplementalNote ?? "") + (isTR
      ? " Yüksek su hassasiyeti göz önüne alındığında, su tüketimini azaltmak için açık buharlaşmalı soğutma kulesi yerine kuru soğutma (hava soğutmalı soğutucu) veya adiabatik destekli soğutmayı değerlendirin."
      : " Given high water sensitivity, consider dry cooling (air-cooled chillers) or adiabatic-assist rather than open evaporative cooling towers to reduce water consumption.");
  }

  // Sustainability modifier note
  if (sustainabilityPriority === "high" && strategy === "chilled-water") {
    supplementalNote = (supplementalNote ?? "") + (isTR
      ? " Yüksek sürdürülebilirlik önceliğiyle: bu sahadaki iklim göz önünde bulundurularak su tarafı ekonomizer veya doğrudan hava tarafı ekonomizasyon (ücretsiz soğutma) değerlendirin."
      : " With high sustainability priority: evaluate waterside economizers or direct airside economization (free cooling) given the climate at this site.");
  }

  const strategies = isTR ? COOLING_STRATEGIES_TR : COOLING_STRATEGIES_EN;
  const base = strategies[strategy];
  return {
    ...base,
    rationale,
    supplementalNote: supplementalNote?.trim() || base.supplementalNote,
  };
}
