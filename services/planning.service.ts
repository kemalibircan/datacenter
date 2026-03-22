// Planning Service - generates concept planning recommendations
import type {
  PlanningInput,
  PlanningRecommendation,
  SiteAnalysisResult,
  ConfidenceLevel,
  ExplanationCard,
} from "@/types/domain";
import type { Lang } from "@/lib/i18n";
import {
  getGrossToNetMultiplier,
  estimateITLoadKw,
  estimateRackCount,
  computeSpaceAllocations,
  buildElectricalConcept,
} from "@/rules/planning-rules";
import { deriveCoolingRecommendation } from "@/rules/cooling-rules";

export function generatePlanning(
  input: PlanningInput,
  analysis: SiteAnalysisResult | null,
  lang: Lang = "en"
): PlanningRecommendation {
  const multiplier = getGrossToNetMultiplier(input);
  const estimatedITLoadKw = estimateITLoadKw(input.whiteSpaceM2, input.rackDensityKw);
  const estimatedRacks = estimateRackCount(input.whiteSpaceM2, input.rackDensityKw);

  const grossMin = Math.round(input.whiteSpaceM2 * multiplier.min);
  const grossMax = Math.round(input.whiteSpaceM2 * multiplier.max);

  const spaceAllocations = computeSpaceAllocations(input, grossMin, grossMax, lang);
  const coolingRecommendation = deriveCoolingRecommendation({ input, analysis, estimatedITLoadKw, lang });
  const electricalConcept = buildElectricalConcept(input, estimatedITLoadKw, lang);

  const siteScore = analysis?.compositeScore.total ?? 65;
  const { verdictLabel, suitabilityVerdict } = deriveVerdict(siteScore, input, analysis, lang);

  const operationalWarnings = buildWarnings(input, analysis, estimatedITLoadKw, lang);
  const mitigationRecommendations = buildMitigations(input, analysis, lang);

  const confidence: ConfidenceLevel = analysis ? "medium" : "low";

  const explanationCards: ExplanationCard[] = [
    {
      metricId: "space-allocation",
      title: lang === "tr" ? "Kavramsal Alan Tahsisi" : "Conceptual Space Allocation",
      valueDisplay: lang === "tr"
        ? `Tahmini ${grossMin}–${grossMax} m² brüt alan`
        : `${grossMin}–${grossMax} m² estimated gross area`,
      score: 80,
      category: lang === "tr" ? "Planlama" : "Planning",
      importance: lang === "tr"
        ? "Beyaz alan (gerçek sunucu alanı) ile toplam brüt tesis alanı arasındaki ilişkiyi anlamak, erken aşama yer seçimi ve bina gereksinimleri için temeldir. Çarpan, yedeklilik stratejisi, soğutma yaklaşımı ve yoğunluğa bağlı olarak önemli ölçüde değişir."
        : "Understanding the relationship between white space (the actual server area) and total gross facility area is fundamental for early-stage site selection and building requirements. The multiplier varies significantly based on redundancy strategy, cooling approach, and density.",
      interpretation: lang === "tr"
        ? `${input.availabilityTier} yedeklilikle ${input.whiteSpaceM2} m² beyaz alan için tahmini brüt tesis alanı, beyaz alanın ${multiplier.min}×–${multiplier.max}× katıdır — yaklaşık ${grossMin}–${grossMax} m².`
        : `For ${input.whiteSpaceM2} m² of white space with ${input.availabilityTier} redundancy, the conceptual gross facility area is estimated at ${multiplier.min}× to ${multiplier.max}× the white space — approximately ${grossMin}–${grossMax} m².`,
      confidenceLevel: "low",
      dataSource: "Estimated" as const,
      limitations: lang === "tr"
        ? [
            "Alan oranları genel eğitim aralıklarıdır — gerçek oranlar mimari tasarıma, yapısal ızgaraya, MEP güzergahına ve operasyonel modele bağlıdır.",
            "Ayrıntılı alan programlaması için lisanslı mimar/MEP mühendisi gereklidir.",
          ]
        : [
            "Space ratios are generic educational ranges — actual ratios depend on architectural design, structural grid, MEP routing, and operational model.",
            "A licensed architect/MEP engineer should perform detailed space programming.",
          ],
      assumptions: lang === "tr"
        ? [
            "Raf başına ~3,5 m² raf yeri (raf + koridor) varsayılmaktadır.",
            `${input.whiteSpaceM2} m² beyaz alan için tahmini ${estimatedRacks} raf.`,
          ]
        : [
            "Assumes ~3.5 m² per rack bay (rack + aisle).",
            `Estimated ${estimatedRacks} racks for ${input.whiteSpaceM2} m² white space.`,
          ],
      thresholds: lang === "tr"
        ? [
            { range: "N Yedeklilik", interpretation: "2,3×–2,8× çarpan", score: "En Küçük" },
            { range: "N+1 Yedeklilik", interpretation: "2,8×–3,8× çarpan", score: "Orta" },
            { range: "2N Yedeklilik", interpretation: "3,5×–4,5× çarpan", score: "En Büyük" },
          ]
        : [
            { range: "N Redundancy", interpretation: "2.3×–2.8× multiplier", score: "Smallest" },
            { range: "N+1 Redundancy", interpretation: "2.8×–3.8× multiplier", score: "Moderate" },
            { range: "2N Redundancy", interpretation: "3.5×–4.5× multiplier", score: "Largest" },
          ],
    },
    {
      metricId: "cooling-strategy",
      title: lang === "tr" ? "Soğutma Stratejisi Önerisi" : "Cooling Strategy Recommendation",
      valueDisplay: coolingRecommendation.label,
      score: 80,
      category: lang === "tr" ? "Planlama" : "Planning",
      importance: lang === "tr"
        ? "Soğutma stratejisi, bir veri merkezinde en kritik erken tasarım kararlarından biridir. CAPEX, OPEX, alan tahsisi, MEP tasarımı ve tesisin gelecekteki yoğunluk artışlarını ölçeklendirme veya karşılama kapasitesini etkiler."
        : "Cooling strategy is one of the most consequential early design decisions in a data center. It affects CAPEX, OPEX, space allocation, MEP design, and the facility's ability to scale or handle future density increases.",
      interpretation: coolingRecommendation.rationale,
      confidenceLevel: "medium",
      dataSource: "Estimated" as const,
      limitations: lang === "tr"
        ? [
            "Soğutma önerisi kavramsal bir başlangıç noktasıdır, tam MEP mühendislik çalışması değildir.",
            "İklim verileri ve giriş parametreleri, ayrıntılı termal analiz için proxy olarak kullanılmaktadır.",
            "Ayrıntılı soğutma yükü hesaplamaları için lisanslı MEP mühendisi gereklidir.",
          ]
        : [
            "Cooling recommendation is a conceptual starting point, not a full MEP engineering study.",
            "Climate data and input parameters are used as proxies for a detailed thermal analysis.",
            "A licensed MEP engineer should perform detailed cooling load calculations.",
          ],
      assumptions: lang === "tr"
        ? [`IT yükü, ${estimatedRacks} raf × ${input.rackDensityKw} kW/raf ortalamasına dayalı olarak ~${Math.round(estimatedITLoadKw)} kW olarak tahmin edilmektedir.`]
        : [`IT load estimated at ~${Math.round(estimatedITLoadKw)} kW based on ${estimatedRacks} racks at ${input.rackDensityKw} kW/rack average.`],
      thresholds: [],
    },
  ];

  return {
    suitabilityVerdict,
    verdictLabel,
    totalGrossEstimateM2: { min: grossMin, max: grossMax },
    grossToNetMultiplier: multiplier,
    spaceAllocations,
    coolingRecommendation,
    electricalConcept,
    operationalWarnings,
    mitigationRecommendations,
    explanationCards,
    confidenceLevel: confidence,
  };
}

function deriveVerdict(
  siteScore: number,
  input: PlanningInput,
  analysis: SiteAnalysisResult | null,
  lang: Lang = "en"
): { verdictLabel: PlanningRecommendation["verdictLabel"]; suitabilityVerdict: string } {
  const isTR = lang === "tr";

  if (siteScore >= 70) {
    return {
      verdictLabel: "proceed",
      suitabilityVerdict: isTR
        ? `Bu saha, veri merkezi geliştirme için olumlu özellikler göstermektedir (saha puanı: ${siteScore}/100). Proxy tahminlenmiş faktörleri doğrulamak için ayrıntılı durum tespiti çalışmasına geçin.`
        : `This site shows favorable characteristics for data center development (site score: ${siteScore}/100). Proceed with detailed due diligence to confirm factors that were proxy-estimated.`,
    };
  } else if (siteScore >= 55) {
    return {
      verdictLabel: "proceed-with-caution",
      suitabilityVerdict: isTR
        ? `Bu saha potansiyel olarak uygulanabilir ancak ele alınması gereken kayda değer risk faktörleri barındırmaktadır (saha puanı: ${siteScore}/100). Saha edinme kararı vermeden önce işaretlenen tüm endişelerin araştırıldığından emin olarak dikkatli ilerleyin.`
        : `This site is potentially viable but has notable risk factors to address (site score: ${siteScore}/100). Proceed with caution and ensure all flagged concerns are investigated before committing to site acquisition.`,
    };
  } else if (siteScore >= 40) {
    return {
      verdictLabel: "significant-concerns",
      suitabilityVerdict: isTR
        ? `Bu sahanın, proje karmaşıklığını ve maliyetini önemli ölçüde artırabilecek önemli sorunları bulunmaktadır (saha puanı: ${siteScore}/100). İşaretlenen faktörlerin uzman incelemesi zorunludur. Paralel olarak alternatif sahalar da değerlendirilmelidir.`
        : `This site has significant challenges that may substantially increase project complexity and cost (site score: ${siteScore}/100). Expert review of flagged factors is essential. Consider alternative sites in parallel.`,
    };
  } else {
    return {
      verdictLabel: "not-recommended",
      suitabilityVerdict: isTR
        ? `Bu saha, mevcut göstergeler bazında veri merkezi geliştirmesi için zayıf bir aday olmasına yol açan birden fazla yüksek riskli faktöre sahiptir (saha puanı: ${siteScore}/100). Bu sinyalleri doğrulamak veya çürütmek için uzman incelemesi gerekecektir.`
        : `This site has multiple high-risk factors that make it a poor candidate for data center development based on available indicators (site score: ${siteScore}/100). A specialist review would be needed to validate or refute these signals.`,
    };
  }
}

function buildWarnings(
  input: PlanningInput,
  analysis: SiteAnalysisResult | null,
  estimatedITLoadKw: number,
  lang: Lang = "en"
): string[] {
  const warnings: string[] = [];
  const isTR = lang === "tr";

  if (input.rackDensityKw >= 15 && input.availabilityTier === "N") {
    warnings.push(isTR
      ? "Yüksek raf yoğunluğu ile yalnızca N yedekliliğinin kombinasyonu önemli bir güç riski yaratır. Yüksek yoğunluklu yük altındaki kritik yolda yaşanacak herhangi bir tek arıza, tesisin tamamen devre dışı kalmasına yol açabilir."
      : "High rack density combined with N-only redundancy creates a significant power risk. Any single critical path failure under high-density load could result in a total facility outage."
    );
  }
  if (input.growthYears >= 10 && input.availabilityTier !== "2N") {
    warnings.push(isTR
      ? "2N'den düşük yedeklilikle 10+ yıllık büyüme ufku ölçeklendirme sorunları yaratabilir. Başından itibaren gelecekteki genişleme için yeterli MEP altyapı alanının ayrıldığından emin olun."
      : "A 10+ year growth horizon with less than 2N redundancy may create scaling challenges. Ensure sufficient MEP infrastructure space is reserved for future expansion from the outset."
    );
  }
  if (input.waterSensitivity === "high" && input.workloadType === "ai-gpu") {
    warnings.push(isTR
      ? "AI/GPU iş yükleri tipik olarak yüksek soğutma talebi doğurur. Yüksek su hassasiyetiyle birleştiğinde bu durum soğutma stratejisi seçeneklerini önemli ölçüde kısıtlar. Kuru soğutma veya daldırmalı soğutma gerekebilir."
      : "AI/GPU workloads typically drive high cooling demand. Combined with high water sensitivity, this limits cooling strategy options significantly. Dry cooling or immersion cooling may be required."
    );
  }
  if (analysis?.hazards?.floodRiskProxy === "high" || analysis?.hazards?.floodRiskProxy === "very-high") {
    warnings.push(isTR
      ? "Sahanın sel riski proxy göstergesi yüksek. Bu durum sigorta maliyetlerini, yapısal gereksinimleri ve ekipman koruma tedbirlerini etkileyebilir. Resmi bir sel etüdü önerilir."
      : "The site's flood risk proxy indicator is elevated. This could impact insurance costs, structural requirements, and equipment protection measures. A formal flood study is recommended."
    );
  }
  if (analysis?.hazards?.seismicRiskProxy === "high" || analysis?.hazards?.seismicRiskProxy === "very-high") {
    warnings.push(isTR
      ? "Bu sahada yüksek sismik risk proxy değeri. Sismik tasarım gereksinimleri yapısal mühendislik maliyetlerini ve süresini etkileyecektir."
      : "Elevated seismic risk proxy at this site. Seismic design requirements will impact structural engineering costs and timeline."
    );
  }
  if (estimatedITLoadKw > 1000) {
    warnings.push(isTR
      ? `Tahmini ~${Math.round(estimatedITLoadKw)} kW IT yükü önemlidir. Şebeke bağlantı kapasitesi ve elektrik hizmet anlaşmaları projenin başlarında teyit edilmelidir — bu, kamuya açık verilerin ötesinde manuel değerlendirme gerektirir.`
      : `Estimated IT load of ~${Math.round(estimatedITLoadKw)} kW is substantial. Grid connection capacity and utility service agreements must be confirmed early in the project — this is a manual assessment requirement beyond what public data can confirm.`
    );
  }

  return warnings;
}

function buildMitigations(
  input: PlanningInput,
  analysis: SiteAnalysisResult | null,
  lang: Lang = "en"
): string[] {
  const mitigations: string[] = [];
  const isTR = lang === "tr";

  mitigations.push(isTR
    ? "Yerel elektrik sağlayıcısıyla şebeke kapasitesini, güvenilirliğini ve bağlantı fizibilitesini doğrulamak için sahaya özgü elektrik etüdü yaptırın."
    : "Commission a site-specific utility study to confirm grid capacity, reliability, and connection feasibility with the local utility provider."
  );
  mitigations.push(isTR
    ? "Zemin taşıma kapasitesini, yeraltı suyu derinliğini ve temel uygunluğunu belirlemek için geoteknik araştırma (sondaj) yaptırın."
    : "Commission a geotechnical investigation (borehole survey) to determine soil bearing capacity, groundwater depth, and foundation suitability."
  );

  if (analysis?.hazards?.floodRiskProxy !== "very-low") {
    mitigations.push(isTR
      ? "Saha edinmesini kesinleştirmeden önce yerel taşkın alanı haritalarını inceleyin ve drenaj ile sel riski değerlendirmesi yaptırın."
      : "Review local flood zone maps and commission a drainage and flood risk assessment before finalizing site acquisition."
    );
  }
  if (input.availabilityTier === "2N" || input.availabilityTier === "N+1") {
    mitigations.push(isTR
      ? "Hedef yedeklilik seviyesi için saha sınırına kadar güç ve telekomünikasyon bağlantısı için en az iki ayrı fiziksel yolun mevcut olduğunu teyit edin."
      : "For the target redundancy level, confirm at least two diverse physical paths for power and telecom connectivity to the site boundary."
    );
  }
  if (analysis?.logistics?.nearestHighwayKm?.distanceKm && analysis.logistics.nearestHighwayKm.distanceKm > 10) {
    mitigations.push(isTR
      ? "Yol erişim mesafesi dikkate değer. Ağır ekipmanların (UPS, jeneratör, transformatör) teslimatı için yol yük limitlerini doğrulayın ve ulaşım lojistik planlamasını göz önünde bulundurun."
      : "Road access distance is notable. Verify road load limits for heavy equipment delivery (UPS, generators, transformers) and consider transportation logistics planning."
    );
  }
  mitigations.push(isTR
    ? "Yatırım kararı vermeden önce bu bölgedeki veri merkezi arazi kullanımı için imar/planlama izinlerini doğrulayın."
    : "Verify zoning/planning permissions for a data center land use in this jurisdiction before making site investment decisions."
  );

  return mitigations;
}
