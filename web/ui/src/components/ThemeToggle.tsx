import { Moon, Sun } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { useTheme } from "../context/ThemeContext";

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:border hover:border-border-subtle hover:bg-surface cursor-pointer min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-border-interactive focus:ring-offset-2 focus:ring-offset-surface"
      aria-label={t("common.theme.toggleLabel")}
      aria-pressed={theme === "dark"}
      type="button"
    >
      {theme === "light" ? (
        <Moon className="h-5 w-5" data-testid="moon-icon" />
      ) : (
        <Sun className="h-5 w-5" data-testid="sun-icon" />
      )}
    </button>
  );
};
