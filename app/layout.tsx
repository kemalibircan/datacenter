import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DC SiteLab — Data Center Site Selection Simulator",
  description:
    "An educational simulator for learning data center site selection, risk assessment, and concept planning. Built for engineers, students, and early-stage planners.",
  keywords: ["data center", "site selection", "educational", "simulator", "engineering"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider><LanguageProvider>{children}</LanguageProvider></TooltipProvider>
      </body>
    </html>
  );
}
