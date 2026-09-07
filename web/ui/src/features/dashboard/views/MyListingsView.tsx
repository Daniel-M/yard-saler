import React, { useState } from "react";
import { Link } from "react-router";
import { Calendar, Clock, MapPin, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { YardSale } from "../hooks/useMyYardSales";
import { EarningsProjection } from "../components/EarningsProjection";

interface MyListingsViewProps {
  yardSales: YardSale[];
  isLoading: boolean;
  error: string | null;
}

export function MyListingsView({
  yardSales,
  isLoading,
  error,
}: MyListingsViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

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
        style:
          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
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

  const filteredYardSales = yardSales.filter((ys) => {
    const isCurrent = new Date(ys.end_date) >= new Date();
    return activeTab === "current" ? isCurrent : !isCurrent;
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <div className="flex lg:flex-row flex-col gap-4 justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-[var(--content-primary)]">
            {t("dashboard.myYardSales")}
          </h2>
          <p className="text-[var(--content-secondary)] font-medium">
            {t("dashboard.myYardSalesSubtitle")}
          </p>
        </div>
        <div className="flex flex-row justify-end">
          <Link
            to="/user/yard-sales/new"
            className="min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition duration-150 shadow-lg cursor-pointer transform hover:scale-[1.02]"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            {t("yard_sale.create.title")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EarningsProjection />
      </div>


      {/* Tabs for active vs past events */}
      <div className="flex border-b border-[var(--border-subtle)] gap-2">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all min-h-[48px] cursor-pointer ${
            activeTab === "current"
              ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
              : "border-transparent text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
          }`}
        >
          {t("dashboard.tabs.current", {
            count: yardSales.filter((ys) => new Date(ys.end_date) >= new Date())
              .length,
          })}
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all min-h-[48px] cursor-pointer ${
            activeTab === "past"
              ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
              : "border-transparent text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
          }`}
        >
          {t("dashboard.tabs.past", {
            count: yardSales.filter((ys) => new Date(ys.end_date) < new Date())
              .length,
          })}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 h-48 animate-pulse" />
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 h-48 animate-pulse" />
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 h-48 animate-pulse" />
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg">
          {error}
        </div>
      ) : filteredYardSales.length === 0 ? (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-12 text-center text-[var(--content-secondary)] max-w-lg mx-auto mt-6">
          <Clock className="h-12 w-12 text-[var(--content-muted)] mx-auto mb-4" />
          <p className="mb-6 text-[var(--content-primary)] font-medium">
            {activeTab === "current"
              ? t("dashboard.noActiveEvents")
              : t("dashboard.noPastEvents")}
          </p>
          {activeTab === "current" && (
            <div className="flex flex-row justify-center gap-2">
              <Link
                to="/user/yard-sales/new"
                className="inline-flex items-center justify-center min-h-[48px] bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-6 py-3 rounded-xl transition duration-150 shadow-md"
              >
                {t("dashboard.getStarted")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredYardSales.map((ys) => {
            const status = getEventStatus(ys.start_date, ys.end_date);
            return (
              <div
                key={ys.id}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl p-6 flex flex-col justify-between hover:border-[var(--border-interactive)] hover:shadow-2xl transition duration-150 relative overflow-hidden group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${status.style}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--content-primary)] truncate group-hover:text-cyan-400 transition-colors duration-150">
                    {ys.title}
                  </h3>
                  {ys.description && (
                    <p className="text-[var(--content-secondary)] text-sm mt-2 line-clamp-2 leading-relaxed">
                      {ys.description}
                    </p>
                  )}

                  <div className="space-y-2 mt-5 pt-4 border-t border-[var(--border-subtle)]/60 text-sm text-[var(--content-primary)]">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-500 shrink-0" />
                      <span>
                        {formatDate(ys.start_date)} - {formatDate(ys.end_date)}
                      </span>
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
