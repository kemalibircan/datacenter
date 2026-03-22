"use client";
import { type ConfidenceLevel, type DataSourceLabel } from "@/types/domain";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
  dataSource?: DataSourceLabel;
  className?: string;
}

const CONFIG_EN: Record<ConfidenceLevel, { label: string; className: string; description: string }> = {
  high: {
    label: "High Confidence",
    className: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    description: "This metric comes from a reliable API data source with low uncertainty.",
  },
  medium: {
    label: "Medium Confidence",
    className: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
    description: "This metric is derived from real data but involves some estimation.",
  },
  low: {
    label: "Proxy Estimate",
    className: "border-orange-500/30 text-orange-400 bg-orange-500/10",
    description: "This metric is estimated using proxies or heuristics. Treat as an indicator, not a precise measurement.",
  },
  "manual-only": {
    label: "Manual Required",
    className: "border-red-500/30 text-red-400 bg-red-500/10",
    description: "This metric cannot be determined from public data. Expert input or on-site assessment is required.",
  },
};

const CONFIG_TR: Record<ConfidenceLevel, { label: string; className: string; description: string }> = {
  high: {
    label: "Yüksek Güven",
    className: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    description: "Bu metrik, düşük belirsizlikle güvenilir bir API veri kaynağından gelmektedir.",
  },
  medium: {
    label: "Orta Güven",
    className: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
    description: "Bu metrik gerçek verilerden türetilmiştir ancak bir miktar tahmin içermektedir.",
  },
  low: {
    label: "Proxy Tahmini",
    className: "border-orange-500/30 text-orange-400 bg-orange-500/10",
    description: "Bu metrik, proxy'ler veya sezgisel yöntemler kullanılarak tahmin edilmektedir. Kesin ölçüm olarak değil, gösterge olarak değerlendirin.",
  },
  "manual-only": {
    label: "Manuel Gerekli",
    className: "border-red-500/30 text-red-400 bg-red-500/10",
    description: "Bu metrik, kamuya açık verilerden belirlenememektedir. Uzman görüşü veya yerinde değerlendirme gereklidir.",
  },
};

export function ConfidenceBadge({ confidence, dataSource, className }: ConfidenceBadgeProps) {
  const { lang } = useLanguage();
  const CONFIG = lang === "tr" ? CONFIG_TR : CONFIG_EN;
  const cfg = CONFIG[confidence];
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help">
        <Badge
          variant="outline"
          className={cn("text-[10px] gap-1 pointer-events-none", cfg.className, className)}
        >
          <Info className="h-2.5 w-2.5" />
          {dataSource ?? cfg.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p className="text-xs">{cfg.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// Score gauge component
interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function ScoreGauge({ score, size = "md", showLabel = true }: ScoreGaugeProps) {
  const color =
    score >= 80 ? "#10b981"
    : score >= 65 ? "#6ee7b7"
    : score >= 50 ? "#fbbf24"
    : score >= 35 ? "#f97316"
    : "#ef4444";

  const radius = size === "lg" ? 48 : size === "md" ? 36 : 24;
  const stroke = size === "lg" ? 8 : 6;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const svgSize = (radius + stroke) * 2 + 4;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/30"
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          fontSize={size === "lg" ? "18" : size === "md" ? "14" : "10"}
          fontWeight="700"
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">/ 100</span>
      )}
    </div>
  );
}
