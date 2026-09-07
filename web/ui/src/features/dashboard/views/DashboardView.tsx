import React from "react";
import { Link } from "react-router";
import { Plus, MessageSquare, Search, Tag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EarningsProjection } from "@features/dashboard/components/EarningsProjection";


interface DashboardViewProps {
  activeListingsCount: number;
  unreadMessagesCount: number;
  isLoading: boolean;
}

export function DashboardView({
  activeListingsCount,
  unreadMessagesCount,
  isLoading,
}: DashboardViewProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-[var(--content-primary)]">
          {t("dashboard.title")}
        </h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 h-36 animate-pulse" />
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 h-36 animate-pulse" />
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 h-36 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Active Listings Stat */}
          <Link
            to="/user/my-listings"
            className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-center justify-between hover:border-[var(--border-interactive)] hover:shadow-lg transition duration-150 group"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--content-secondary)]">
                {t("dashboard.quickStats.activeListings")}
              </p>
              <p className="text-4xl font-extrabold text-[var(--content-primary)] group-hover:text-cyan-400 transition-colors">
                {activeListingsCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center">
              <Tag className="h-6 w-6" />
            </div>
          </Link>

          {/* Unread Messages Stat */}
          <Link
            to="/messages"
            className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-6 flex items-center justify-between hover:border-[var(--border-interactive)] hover:shadow-lg transition duration-150 group"
          >
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--content-secondary)]">
                {t("dashboard.quickStats.unreadMessages")}
              </p>
              <p className="text-4xl font-extrabold text-[var(--content-primary)] group-hover:text-cyan-400 transition-colors">
                {unreadMessagesCount}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
          </Link>

          {/* Projected Earnings Stat */}
          <EarningsProjection />
        </div>
      )}


      {/* Quick Actions Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-[var(--content-primary)]">
          {t("dashboard.quickStats.quickActions")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/user/yard-sales/new"
            className="min-h-[64px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--surface-elevated)] hover:border-[var(--border-interactive)] transition duration-150"
          >
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sm text-[var(--content-primary)]">
              {t("dashboard.actions.createListing")}
            </span>
          </Link>

          <Link
            to="/messages"
            className="min-h-[64px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--surface-elevated)] hover:border-[var(--border-interactive)] transition duration-150"
          >
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sm text-[var(--content-primary)]">
              {t("dashboard.actions.viewMessages")}
            </span>
          </Link>

          <Link
            to="/user/explore"
            className="min-h-[64px] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center gap-3 hover:bg-[var(--surface-elevated)] hover:border-[var(--border-interactive)] transition duration-150"
          >
            <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
              <Search className="h-5 w-5" />
            </div>
            <span className="font-semibold text-sm text-[var(--content-primary)]">
              {t("dashboard.actions.explore")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
