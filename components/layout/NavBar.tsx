"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Server, Map, BarChart3, GitCompare, BookOpen, Activity, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

export function NavBar() {
  const pathname = usePathname();
  const isMock = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
  const { lang, setLang, t } = useLanguage();

  const navItems = [
    { href: "/", label: t("nav_home"), icon: Server },
    { href: "/analyze", label: t("nav_analyze"), icon: Map },
    { href: "/plan", label: t("nav_plan"), icon: BarChart3 },
    { href: "/compare", label: t("nav_compare"), icon: GitCompare },
    { href: "/scenarios", label: t("nav_scenarios"), icon: BookOpen },
    { href: "/operations", label: t("nav_operations"), icon: Activity },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
          <Server className="h-5 w-5 text-blue-400" />
          <span className="text-sm font-bold tracking-wide">DC SiteLab</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 hidden sm:flex">
            {t("nav_educational")}
          </Badge>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                pathname === href
                  ? "bg-blue-500/10 text-blue-400 font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "tr" : "en")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all",
              "border-border/60 bg-card/60 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
            )}
            title="Switch language / Dil Değiştir"
          >
            <Languages className="h-3.5 w-3.5" />
            <span>{lang === "en" ? "TR" : "EN"}</span>
          </button>

          {isMock && (
            <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-400">
              {t("nav_demo_mode")}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
