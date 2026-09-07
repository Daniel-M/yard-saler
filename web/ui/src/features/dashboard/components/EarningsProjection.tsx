import React from "react";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProjectedEarnings } from "@features/dashboard/hooks/useProjectedEarnings";

export const EarningsProjection: React.FC = () => {
  const { t } = useTranslation();
  const { data, isLoading, error } = useProjectedEarnings();

  if (isLoading) {
    return (
      <div className="bg-surface border border-border-subtle rounded-2xl p-6 h-36 animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="bg-surface border border-border-subtle rounded-2xl p-6">
        <p className="text-sm text-rose-500">{error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const currentSold = data.current_sold ?? data.projected_earnings ?? 0;
  const projectedSold = data.projected_sold ?? data.target ?? 0;

  const progressPct = projectedSold > 0
    ? Math.min((currentSold / projectedSold) * 100, 100)
    : 0;

  return (
    <div className="bg-surface border border-border-subtle rounded-2xl p-6 flex items-start gap-4 hover:border-border-interactive hover:shadow-lg transition duration-150">
      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
        <TrendingUp className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm font-semibold text-content-secondary">
          {t("dashboard.earnings.title")}
        </p>
        <p className="text-4xl font-extrabold text-content-primary">
          ${currentSold.toFixed(2)}
          {currentSold > 0 && (
            <span className="ml-2" aria-hidden="true">
              🤑
            </span>
          )}
        </p>
        <div className="space-y-1">
          <div className="w-full bg-surface-elevated rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-xs text-content-muted">
            {t("dashboard.earnings.ofTarget", {
              target: `$${projectedSold.toFixed(2)}`,
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
