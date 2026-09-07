import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Coffee } from "lucide-react";
import { useTranslation } from "react-i18next";
import brebQr from "@/assets/breb_qr.png";

interface CoffeeModalProps {
  onClose: () => void;
}

const FUNDING_GOAL = 20;
const FUNDING_PCT = 70;
const FUNDING_CURRENT = (FUNDING_GOAL * FUNDING_PCT) / 100;

export const CoffeeModal: React.FC<CoffeeModalProps> = ({ onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[100] bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coffee-modal-title"
      onClick={onClose}
    >
      <div
        className="relative bg-surface border border-border-subtle rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
          aria-label={t("common.buttons.close")}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Icon + title */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center">
            <Coffee className="h-6 w-6" />
          </div>
          <h2
            id="coffee-modal-title"
            className="text-lg font-bold text-content-primary text-center"
          >
            {t("header.coffee.title")}
          </h2>
        </div>

        {/* QR code */}
        <img
          src={brebQr}
          alt={t("header.coffee.qrAlt")}
          className="w-48 h-48 object-contain rounded-xl border border-border-subtle"
        />

        {/* Thank-you note */}
        <p className="text-sm text-content-secondary text-center">
          {t("header.coffee.thankYou")}
        </p>

        {/* Funding progress bar */}
        <div className="w-full space-y-1">
          <div className="flex justify-between text-xs text-content-muted">
            <span>{t("header.coffee.fundingLabel")}</span>
            <span>
              ${FUNDING_CURRENT.toFixed(0)} / ${FUNDING_GOAL}
            </span>
          </div>
          <div className="w-full bg-surface-elevated rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-amber-400 h-full rounded-full"
              style={{ width: `${FUNDING_PCT}%` }}
              role="progressbar"
              aria-valuenow={FUNDING_PCT}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-content-muted text-right">
            {FUNDING_PCT}% {t("header.coffee.funded")}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

