import { AlertTriangle } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

export const UnverifiedBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = localStorage.getItem("user_status");

  if (status !== "VERIFIED") {
    return null;
  }

  return (
    <div
      className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 px-4 py-3 text-center text-sm font-semibold flex items-center justify-center gap-2"
      data-testid="unverified-banner"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>{t("auth.unverifiedBanner.text")}</span>
      <button
        onClick={() => navigate("/auth/verify")}
        className="underline hover:text-amber-300 ml-1 cursor-pointer focus:outline-none"
      >
        {t("auth.unverifiedBanner.link")}
      </button>
    </div>
  );
};
