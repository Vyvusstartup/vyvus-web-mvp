import "./globals.css";
import React from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import LangSwitcher from "@/components/LangSwitcher";

export const metadata = {
  title: "Vyvus — Longevity Score (DEMO)",
  description: "Educativo, no diagnóstico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <I18nProvider>
          <div className="container py-8">
            <header className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold">Vyvus — Longevity Score (DEMO)</h1>
                  <p className="text-sm text-neutral900/70">
                    Educativo · No diagnóstico · Percentiles DEMO
                  </p>
                </div>
                <LangSwitcher />
              </div>
            </header>

            {children}

            <footer className="mt-16 text-xs text-neutral900/60">
              <p>
                © {new Date().getFullYear()} Vyvus — DEMO. Esta herramienta es educativa y no
                brinda diagnóstico médico.
              </p>
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}
