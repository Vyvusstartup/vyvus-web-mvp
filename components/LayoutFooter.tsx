"use client";
import { useI18n } from "@/i18n/I18nProvider";

export default function LayoutFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <p className="mt-16 text-xs text-neutral900/60">
      © {year} Vyvus — DEMO. {t("disclaimer.educational")}
    </p>
  );
}
