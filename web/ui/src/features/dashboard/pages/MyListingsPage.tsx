import React from "react";
import { useVerificationGuard } from "@hooks/useVerificationGuard";
import { useMyYardSales } from "../hooks/useMyYardSales";
import { MyListingsView } from "../views/MyListingsView";

export default function MyListingsPage() {
  const { checking } = useVerificationGuard({ allowedStatus: "verified" });
  const { yardSales, isLoading, error } = useMyYardSales();

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

  return (
    <MyListingsView
      yardSales={yardSales}
      isLoading={isLoading}
      error={error}
    />
  );
}
