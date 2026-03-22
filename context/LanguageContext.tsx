"use client";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Lang, type TranslationKey, translations } from "@/lib/i18n";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dc-sitelab-lang") as Lang | null;
      if (stored === "en" || stored === "tr") {
        setLangState(stored);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem("dc-sitelab-lang", newLang);
    } catch {
      // ignore
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] as string;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
