"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Server, Building2, Headset, Settings, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ServiceFunction {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  team: string;
  responsibilities: string[];
  status: "operational" | "degraded" | "critical";
  metrics: { label: string; value: string }[];
  educationalNote: string;
}

const SERVICE_FUNCTIONS: ServiceFunction[] = [
  {
    icon: Headset,
    title: "Service Desk",
    team: "Operations Center",
    responsibilities: [
      "First point of contact for all facility events",
      "Incident logging and tracking",
      "Ticket routing to specialist teams",
      "On-call coordination",
    ],
    status: "operational",
    metrics: [
      { label: "Open Tickets", value: "14" },
      { label: "Avg. Response", value: "8 min" },
      { label: "SLA Compliance", value: "97%" },
    ],
    educationalNote: "The service desk is the central coordination point for all data center operations issues. In ITIL, it owns incident management — not problem management, which goes deeper into root causes.",
  },
  {
    icon: Server,
    title: "IT Operations",
    team: "NOC Team (24/7)",
    responsibilities: [
      "24/7 monitoring via BMS and DCIM tools",
      "Event triage and classification",
      "Escalation to technical management",
      "Change management coordination",
    ],
    status: "operational",
    metrics: [
      { label: "Monitored Systems", value: "340" },
      { label: "Events Today", value: "2,847" },
      { label: "Suppressed Events", value: "2,831" },
    ],
    educationalNote: "Large data centers can generate millions of events daily. Event suppression and correlation rules reduce thousands of raw events to a handful of actionable alarms — this is the core skill of NOC design.",
  },
  {
    icon: Settings,
    title: "Technical Management",
    team: "Engineering Teams",
    responsibilities: [
      "Deep technical expertise per domain (network, servers, storage)",
      "Vendor management and escalations",
      "Change implementation and testing",
      "Skills gap management",
    ],
    status: "operational",
    metrics: [
      { label: "Open Changes", value: "7" },
      { label: "Pending Approvals", value: "3" },
      { label: "Avg. Skill Score", value: "76%" },
    ],
    educationalNote: "Technical management teams are organized by technology silos (network, servers, storage, cooling). They provide deep expertise but are not always on-site — they are on-call for high-severity escalations.",
  },
  {
    icon: Building2,
    title: "Facility Operations",
    team: "Facilities Team",
    responsibilities: [
      "Electrical systems (UPS, switchgear, generators)",
      "Mechanical systems (HVAC, chillers, cooling towers)",
      "Building and physical security",
      "Energy management and reporting",
    ],
    status: "operational",
    metrics: [
      { label: "Open Work Orders", value: "9" },
      { label: "Overdue PM Tasks", value: "3" },
      { label: "Facility Status", value: "Normal" },
    ],
    educationalNote: "Facility operations is as critical as IT operations. Data centers fail more often due to power and cooling issues than to IT equipment failures. Coordinating IT and facility teams under a unified service management framework reduces gap risks.",
  },
  {
    icon: Shield,
    title: "IT Security Management",
    team: "Security Team",
    responsibilities: [
      "Access management (physical and logical)",
      "Continuous monitoring and threat detection",
      "Vulnerability assessment and patching",
      "Security policy development",
    ],
    status: "operational",
    metrics: [
      { label: "Security Events", value: "1,204" },
      { label: "After-Hours Entries", value: "2" },
      { label: "Patch Compliance", value: "94%" },
    ],
    educationalNote: "ISO 27001 is the most widely adopted standard for information security management systems (ISMS) in data centers. Physical access management and logical access management must be coordinated — a breach in either can compromise the other.",
  },
  {
    icon: Users,
    title: "Application Management",
    team: "App Support Teams",
    responsibilities: [
      "Application monitoring and support",
      "Development/operations coordination",
      "Performance tuning and capacity planning",
      "Customer escalation interface",
    ],
    status: "operational",
    metrics: [
      { label: "Managed Services", value: "23" },
      { label: "SLA Breaches (MTD)", value: "1" },
      { label: "Open Incidents", value: "4" },
    ],
    educationalNote: "Application management bridges the gap between IT infrastructure and business users. While infrastructure teams manage servers and networks, application teams ensure the software services running on that infrastructure meet their SLAs.",
  },
];

function InfoTip({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-start gap-2 p-2.5 rounded bg-blue-500/5 border border-blue-500/15">
      <Info className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

export function ServiceOperationsPanel() {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      {/* Intro */}
      <Card className="bg-blue-500/5 border-blue-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm text-blue-300">{t("so_framework_title")}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 text-xs text-muted-foreground leading-relaxed">
          <p>{t("so_framework_p1")}</p>
          <p className="mt-2">{t("so_framework_p2")}</p>
        </CardContent>
      </Card>

      {/* Service Functions Grid */}
      {SERVICE_FUNCTIONS.map(fn => {
        const Icon = fn.icon;
        const statusColors = {
          operational: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
          degraded: "text-amber-400 border-amber-500/30 bg-amber-500/10",
          critical: "text-red-400 border-red-500/30 bg-red-500/10",
        };
        return (
          <Card key={fn.title} className="bg-card/60 border-border/40">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm">{fn.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">{fn.team}</p>
                  </div>
                </div>
                <Badge className={cn("text-[10px] border capitalize", statusColors[fn.status])}>
                  {fn.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Metrics */}
              <div className="flex gap-4 mb-3">
                {fn.metrics.map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-base font-bold">{m.value}</div>
                    <div className="text-[10px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
              {/* Responsibilities */}
              <ul className="space-y-0.5 mb-2">
                {fn.responsibilities.map(r => (
                  <li key={r} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-blue-400 shrink-0">·</span>{r}
                  </li>
                ))}
              </ul>
              <InfoTip text={fn.educationalNote} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
