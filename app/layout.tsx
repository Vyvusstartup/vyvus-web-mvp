import "./globals.css";
import React from "react";
import { I18nProvider } from "@/i18n/I18nProvider";
import LangSwitcher from "@/components/LangSwitcher";
import LayoutTagline from "@/components/LayoutTagline";
import LayoutFooter from "@/components/LayoutFooter";
import RegisterSW from "@/components/RegisterSW";

export const metadata = {
  title: "Vyvus — Longevity Score (DEMO)",
  description: "Educativo, no diagnóstico",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#6366F1" />
        <meta name="application-name" content="Vyvus" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Vyvus" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Favicon / Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body>
        <I18nProvider>
          {/* registra el Service Worker */}
          <RegisterSW />

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

