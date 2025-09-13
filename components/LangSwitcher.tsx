"use client";
import { useI18n } from "@/i18n/I18nProvider";

export default function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const base = "px-3 py-1 rounded transition";
  return (
    <div className="flex gap-2 items-center">
      <button
        className={`${base} ${lang === "es" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
        onClick={() => setLang("es")}
        aria-pressed={lang === "es"}
      >
        ES
      </button>
      <button
        className={`${base} ${lang === "en" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
