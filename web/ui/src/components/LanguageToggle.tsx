import { Languages } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

export const LanguageToggle: React.FC = () => {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language || "es";
    // Support potential localized codes like 'es-ES' or 'es-US' by checking startswith
    const nextLang = currentLang.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(nextLang);
  };

  const currentLangCode = (i18n.language || "es").startsWith("es")
    ? "ES"
    : "EN";
  const targetLang = currentLangCode === "ES" ? "EN" : "ES";

  return (
    <button
      onClick={toggleLanguage}
      className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:border hover:bg-surface cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center gap-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-border-interactive focus:ring-offset-2 focus:ring-offset-surface font-semibold text-xs"
      aria-label={t("common.language.toggleLabel")}
      type="button"
    >
      <Languages className="h-4 w-4" data-testid="languages-icon" />
      <span className="uppercase">{targetLang}</span>
    </button>
  );
};
