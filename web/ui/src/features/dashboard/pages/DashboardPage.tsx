import React from "react";
import { useVerificationGuard } from "@hooks/useVerificationGuard";
import { useMyYardSales } from "../hooks/useMyYardSales";
import { useUnreadCount } from "@hooks/useMessaging";
import { DashboardView } from "../views/DashboardView";

export default function DashboardPage() {
  const { checking } = useVerificationGuard({ allowedStatus: "verified" });
  const { yardSales, isLoading: yardSalesLoading } = useMyYardSales();
  const { count: unreadMessagesCount, isLoading: unreadLoading } = useUnreadCount();

  if (checking) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex items-center justify-center"
        data-testid="loading-skeleton"
      >
        <div className="h-6 w-6 border-2 border-slate-700 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  const activeListingsCount = yardSales.filter(
    (ys) => new Date(ys.end_date) >= new Date()
  ).length;

  return (
    <DashboardView
      activeListingsCount={activeListingsCount}
      unreadMessagesCount={unreadMessagesCount}
      isLoading={yardSalesLoading || unreadLoading}
    />
  );
}
