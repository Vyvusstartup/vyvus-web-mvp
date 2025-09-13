"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import es from "@/messages/es.json";
import en from "@/messages/en.json";

type Lang = "es" | "en";
type Dict = Record<string, string>;

const dicts: Record<Lang, Dict> = { es, en };

const I18nCtx = createContext<{
  lang: Lang;
  t: (k: string) => string;
  setLang: (l: Lang) => void;
} | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("lang") as Lang | null;
      if (saved === "en" || saved === "es") return saved;
    }
    return "es";
  });

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("lang", lang);
    // actualiza <html lang="..."> por accesibilidad/SEO
    if (typeof document !== "undefined") document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const t = (k: string) => dicts[lang][k] ?? k;

  return (
    <I18nCtx.Provider value={{ lang, t, setLang }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("I18nProvider missing");
  return ctx;
}
