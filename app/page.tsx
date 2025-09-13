"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/I18nProvider";

export default function Home() {
  const { t } = useI18n();
  return (
    <main className="p-6">
      <h2 className="text-xl font-semibold mb-2">Vyvus Longevity Score</h2>
      <p className="text-sm text-gray-600 mb-6">
        {t("disclaimer.demo")} {t("disclaimer.educational")}
      </p>
      <Link
        href="/calcular"
        className="inline-block px-4 py-2 rounded bg-indigo-600 text-white"
      >
        {t("cta.calculate")}
      </Link>
    </main>
  );
}
