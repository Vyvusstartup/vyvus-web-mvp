"use client";
import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

function tr(lang: "es" | "en", es: string, en: string) {
  return lang === "en" ? en : es;
}

export default function Home() {
  const { lang } = useI18n();

  return (
    <main className="space-y-8">
      {/* Hero */}
      <section className="rounded-2xl p-6 sm:p-8 bg-gradient-to-br from-indigo-50 to-white border">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          {tr(lang, "Tu Longevity Score en minutos", "Your Longevity Score in minutes")}
        </h2>
        <p className="text-neutral900/80 mb-6">
          {tr(
            lang,
            "Ingresa 10 métricas clave y obtén un score 0–100 con explicación simple y basada en evidencia.",
            "Enter 10 key metrics and get a 0–100 score with a simple, evidence-based explanation."
          )}
        </p>

        <div className="flex flex-wrap gap-3">
          <Link href="/calcular" className="btn btn-primary">
            {tr(lang, "Calcular mi score", "Calculate my score")}
          </Link>
          <Link href="/calcular#demo" className="btn bg-neutral100">
            {tr(lang, "Ver perfiles demo", "View demo profiles")}
          </Link>
        </div>
      </section>

      {/* 3 bullets de valor */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold mb-1">
            {tr(lang, "Evidencia, no opiniones", "Evidence, not opinions")}
          </h3>
          <p className="text-sm text-neutral900/80">
            {tr(
              lang,
              "Explicaciones con referencias (OMS/AHA, etc.).",
              "Explanations with references (WHO/AHA, etc.)."
            )}
          </p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">
            {tr(lang, "Rápido y claro", "Fast and clear")}
          </h3>
          <p className="text-sm text-neutral900/80">
            {tr(
              lang,
              "Score en tiempo real, tips accionables.",
              "Real-time score, actionable tips."
            )}
          </p>
        </div>
        <div className="card">
          <h3 className="font-semibold mb-1">
            {tr(lang, "Listo para móvil (PWA)", "Mobile-ready (PWA)")}
          </h3>
          <p className="text-sm text-neutral900/80">
            {tr(
              lang,
              "Instálalo en iOS/Android desde el navegador.",
              "Install on iOS/Android from the browser."
            )}
          </p>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="rounded-xl border p-4 bg-white">
        <p className="text-xs text-neutral900/70">
          {tr(
            lang,
            "DEMO sin calibración poblacional ni integraciones. Contenido educativo. No reemplaza consejo médico.",
            "DEMO without population calibration or integrations. Educational content. Not medical advice."
          )}
        </p>
      </section>
    </main>
  );
}
