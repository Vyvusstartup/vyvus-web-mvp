"use client";
import { useI18n } from "@/i18n/I18nProvider";

export default function LayoutTagline() {
  const { t } = useI18n();
  return (
    <p className="text-sm text-neutral900/70">
      {t("disclaimer.demo")} {t("disclaimer.educational")}
    </p>
  );
}
