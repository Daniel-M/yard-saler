import React, { useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { useExploreListings } from "../hooks/useExploreListings";
import { Search, MapPin, Calendar, AlertCircle, ArrowRight } from "lucide-react";

export default function ExploreView() {
  const { t } = useTranslation();
  const { filteredYardSales, userCity, isLoading, error } = useExploreListings();
  const [searchTerm, setSearchTerm] = useState("");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getEventStatus = (startStr: string, endStr: string) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (now >= start && now <= end) {
      return {
        label: t("yard_sale.detail.status.now"),
        style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      };
    } else if (now < start) {
      return {
        label: t("yard_sale.detail.status.upcoming"),
        style: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
      };
    } else {
      return {
        label: t("yard_sale.detail.status.completed"),
        style: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
      };
    }
  };

  const displayedYardSales = filteredYardSales.filter((ys) => {
    const query = searchTerm.toLowerCase();
    return (
      ys.title.toLowerCase().includes(query) ||
      (ys.description && ys.description.toLowerCase().includes(query)) ||
      ys.location.toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-[var(--content-primary)]">{t("explore.title")}</h2>
        <p className="text-[var(--content-secondary)] font-medium">
          {userCity ? t("explore.yourCity", { city: userCity }) : t("explore.subtitle")}
        </p>
      </div>

      {!userCity && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex gap-3 items-start">
            <AlertCircle className="h-6 w-6 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-white">{t("explore.noProfileLocationTitle")}</h4>
              <p className="text-sm text-[var(--content-secondary)] mt-1">{t("explore.noProfileLocation")}</p>
            </div>
          </div>
          <Link
            to="/user/settings"
            className="min-h-[44px] bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-5 py-2 rounded-xl flex items-center gap-2 transition duration-150 shadow-md shrink-0 cursor-pointer"
          >
            {t("dashboard.nav.settings")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {userCity && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--content-muted)]" />
          <input
            type="text"
            placeholder={t("explore.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[var(--surface)] border border-[var(--border-subtle)] text-[var(--content-primary)] rounded-xl text-sm focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg">
          {error}
        </div>
      ) : userCity && displayedYardSales.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center text-[var(--content-secondary)] max-w-lg mx-auto mt-6">
          <MapPin className="h-12 w-12 text-[var(--content-muted)] mx-auto mb-4" />
          <p className="mb-2 text-[var(--content-primary)] font-medium">
            {t("explore.noListings", { city: userCity })}
          </p>
          <p className="text-sm text-[var(--content-muted)]">
            {t("explore.noListingsSubtitle")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedYardSales.map((ys) => {
            const status = getEventStatus(ys.start_date, ys.end_date);
            return (
              <div
                key={ys.id}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-6 flex flex-col justify-between hover:border-[var(--border-interactive)] hover:shadow-2xl transition duration-150 relative overflow-hidden group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${status.style}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--content-primary)] truncate group-hover:text-cyan-400 transition-colors duration-150">
                    {ys.title}
                  </h3>
                  {ys.description && (
                    <p className="text-[var(--content-secondary)] text-sm mt-2 line-clamp-2 leading-relaxed">{ys.description}</p>
                  )}

                  <div className="space-y-2 mt-5 pt-4 border-t border-[var(--border-subtle)]/60 text-sm text-[var(--content-primary)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-500 shrink-0" />
                      <span>{formatDate(ys.start_date)} - {formatDate(ys.end_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-cyan-500 shrink-0" />
                      <span className="truncate">{ys.location}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex gap-2">
                  <Link
                    to={`/ys/e/${ys.event_code}`}
                    className="flex-1 min-h-[48px] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] active:bg-[var(--border-subtle)] text-[var(--content-primary)] font-semibold rounded-xl flex items-center justify-center transition duration-150 border border-[var(--border-subtle)]"
                  >
                    {t("dashboard.viewEvent")}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
