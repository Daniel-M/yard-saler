import React, { useState } from "react";
import { Coffee } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CoffeeModal } from "./CoffeeModal";

export const CoffeeButton: React.FC = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 text-content-secondary hover:text-amber-400 rounded-lg hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
        aria-label={t("header.coffee.buttonAriaLabel")}
        title={t("header.coffee.buttonAriaLabel")}
      >
        <Coffee className="h-5 w-5" />
      </button>
      {open && <CoffeeModal onClose={() => setOpen(false)} />}
    </>
  );
};
