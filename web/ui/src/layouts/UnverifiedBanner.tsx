import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { Banner } from "@components/common/Banner";

export const UnverifiedBanner: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = localStorage.getItem("user_status");

  if (status !== "VERIFIED") {
    return null;
  }

  return (
    <Banner
      variant="warning"
      className="rounded-none border-x-0 border-t-0 text-center flex justify-center py-3"
      autoDismiss={false}
      message={
        <span className="flex items-center gap-1">
          <span>{t("auth.unverifiedBanner.text")}</span>
          <button
            onClick={() => navigate("/auth/verify")}
            className="underline hover:text-amber-300 ml-1 cursor-pointer focus:outline-none font-semibold"
          >
            {t("auth.unverifiedBanner.link")}
          </button>
        </span>
      }
    />
  );
};
