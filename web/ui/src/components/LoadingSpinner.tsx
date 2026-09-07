import React from "react";
import { useTranslation } from "react-i18next";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  const { t } = useTranslation();

  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-3",
  };

  return (
    <div
      role="status"
      aria-label={t("common.loading")}
      className={`${sizeClasses[size]} border-border-subtle border-t-accent-blue rounded-full animate-spin`}
      data-testid="loading-spinner"
    />
  );
};

export default LoadingSpinner;
