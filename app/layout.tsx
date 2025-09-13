import "./globals.css";
import React from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import LangSwitcher from "@/components/LangSwitcher";
import LayoutTagline from "@/components/LayoutTagline";
import LayoutFooter from "@/components/LayoutFooter";

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
                  <LayoutTagline />
                </div>
                <LangSwitcher />
              </div>
            </header>

            {children}

            <footer>
              <LayoutFooter />
            </footer>
          </div>
        </I18nProvider>
      </body>
    </html>
  );
}

