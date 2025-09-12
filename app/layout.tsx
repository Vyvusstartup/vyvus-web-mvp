import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Vyvus — Longevity Score (DEMO)',
  description: 'Educativo, no diagnóstico',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="container py-8">
          <header className="mb-8">
            <h1 className="text-2xl font-bold">Vyvus — Longevity Score (DEMO)</h1>
            <p className="text-sm text-neutral900/70">Educativo · No diagnóstico · Percentiles DEMO</p>
          </header>
          {children}
          <footer className="mt-16 text-xs text-neutral900/60">
            <p>© {new Date().getFullYear()} Vyvus — DEMO. Esta herramienta es educativa y no brinda diagnóstico médico.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
