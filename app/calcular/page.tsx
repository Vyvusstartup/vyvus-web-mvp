"use client";

import ScoreForm from "@/components/ScoreForm";
import { useI18n } from "@/i18n/I18nProvider";

export default function Calcular() {
  const { t } = useI18n();
  return (
    <main className="space-y-6">
      <p className="text-sm text-gray-600">
        {t("disclaimer.demo")} {t("disclaimer.educational")}
      </p>
      <ScoreForm />
    </main>
  );
}
