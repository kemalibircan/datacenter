"use client";
import type { ClimateProfile } from "@/types/domain";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

interface ClimateChartProps {
  climate: ClimateProfile;
}

export function ClimateChart({ climate }: ClimateChartProps) {
  const [isOpen, setIsOpen] = useState(false);

  const tempData = climate.monthly.map((m) => ({
    month: MONTH_LABELS[m.month - 1],
    avg: parseFloat(m.avgTempC.toFixed(1)),
    max: parseFloat(m.maxTempC.toFixed(1)),
    min: parseFloat(m.minTempC.toFixed(1)),
  }));

  const precipData = climate.monthly.map((m) => ({
    month: MONTH_LABELS[m.month - 1],
    precip: parseFloat(m.precipMm.toFixed(1)),
  }));

  const chartStyle = {
    background: "transparent",
    fontFamily: "inherit",
    fontSize: 11,
  };

  return (
    <div className="border border-border/40 rounded-lg bg-card/30 overflow-hidden">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
      >
        <div className="text-left">
          <h3 className="text-sm font-medium">Climate Profile</h3>
          <p className="text-xs text-muted-foreground">
            {climate.annualAvgTempC.toFixed(1)}°C avg • {climate.climateZone.replace(/-/g, " ")} zone
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="px-4 pb-4 border-t border-border/30">
          <Tabs defaultValue="temperature">
            <div className="flex items-center justify-between mt-3 mb-3">
              <p className="text-xs text-muted-foreground">
                10-year historical averages
              </p>
              <TabsList className="h-7">
                <TabsTrigger value="temperature" className="text-xs h-6 px-2">Temperature</TabsTrigger>
                <TabsTrigger value="precipitation" className="text-xs h-6 px-2">Precipitation</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="temperature" className="mt-0">
              <ResponsiveContainer width="100%" height={150} style={chartStyle}>
                <AreaChart data={tempData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} unit="°C" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 11 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Area type="monotone" dataKey="max" name="Max" stroke="#ef4444" strokeWidth={1.5} fill="none" dot={false} />
                  <Area type="monotone" dataKey="avg" name="Avg" stroke="#f97316" strokeWidth={2} fill="url(#tempGradient)" dot={false} />
                  <Area type="monotone" dataKey="min" name="Min" stroke="#60a5fa" strokeWidth={1.5} fill="none" dot={false} />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="precipitation" className="mt-0">
              <ResponsiveContainer width="100%" height={150} style={chartStyle}>
                <BarChart data={precipData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} unit=" mm" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 11 }}
                    labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                  />
                  <Bar dataKey="precip" name="Precip (mm)" fill="#3b82f6" opacity={0.8} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <div className="grid grid-cols-4 gap-3 mt-3 text-center">
              {[
                { label: "Annual Avg", value: `${climate.annualAvgTempC.toFixed(1)}°C` },
                { label: "Peak Max", value: `${climate.annualMaxTempC.toFixed(0)}°C` },
                { label: "Hot Days", value: `${climate.hotDaysPerYear}/yr`, info: ">35°C" },
                { label: "Precip", value: `${climate.annualPrecipMm.toFixed(0)} mm` },
              ].map(({ label, value, info }) => (
                <div key={label} className="bg-muted/20 rounded px-2 py-1.5">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{label}</div>
                  <div className="text-xs font-semibold">{value}</div>
                  {info && <div className="text-[9px] text-muted-foreground">{info}</div>}
                </div>
              ))}
            </div>
          </Tabs>
        </div>
      )}
    </div>
  );
}
