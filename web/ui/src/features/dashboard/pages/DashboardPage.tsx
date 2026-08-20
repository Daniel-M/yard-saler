import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { apiClient } from "@services/api/client";
import { Calendar, MapPin, Plus, Clock } from "lucide-react";

interface YardSale {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  event_code: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [yardSales, setYardSales] = useState<YardSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"current" | "past">("current");

  useEffect(() => {
    const status = localStorage.getItem("user_status");
    if (status === "VERIFIED_PENDING_DETAILS") {
      navigate("/user/register", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchMyYardSales = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient<{ yard_sales: YardSale[] }>("/api/yard-sales/me");
        setYardSales(data.yard_sales || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load your yard sales");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyYardSales();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getEventStatus = (startStr: string, endStr: string) => {
    const now = new Date();
    const start = new Date(startStr);
    const end = new Date(endStr);

    if (now >= start && now <= end) {
      return {
        label: "Happening Now",
        style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      };
    } else if (now < start) {
      return {
        label: "Upcoming",
        style: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
      };
    } else {
      return {
        label: "Completed",
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-50">My Yard Sales</h2>
          <p className="text-slate-400 font-medium">Manage and check your yard sale events and listings</p>
        </div>
        <Link
          to="/user/yard-sales/new"
          className="min-h-[48px] bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition duration-150 shadow-lg cursor-pointer transform hover:scale-[1.02]"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
          {t("yard_sale.create.title")}
        </Link>
      </div>

      {/* Tabs for active vs past events */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all min-h-[48px] cursor-pointer ${
            activeTab === "current"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Current Events ({yardSales.filter(ys => new Date(ys.end_date) >= new Date()).length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all min-h-[48px] cursor-pointer ${
            activeTab === "past"
              ? "border-cyan-500 text-cyan-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Past Events ({yardSales.filter(ys => new Date(ys.end_date) < new Date()).length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg">
          {error}
        </div>
      ) : filteredYardSales.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-12 text-center text-slate-400 max-w-lg mx-auto mt-6">
          <Clock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="mb-6 text-slate-300 font-medium">
            {activeTab === "current"
              ? "You have no active yard sale events scheduled right now."
              : "You have no past yard sale events on record."}
          </p>
          {activeTab === "current" && (
            <Link
              to="/user/yard-sales/new"
              className="inline-flex min-h-[48px] bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-6 py-3 rounded-xl transition duration-150 shadow-md"
            >
              Get Started
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredYardSales.map((ys) => {
            const status = getEventStatus(ys.start_date, ys.end_date);
            return (
              <div
                key={ys.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl transition duration-150 relative overflow-hidden group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${status.style}`}>
                      {status.label}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-50 truncate group-hover:text-cyan-400 transition-colors duration-150">
                    {ys.title}
                  </h3>
                  {ys.description && (
                    <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">{ys.description}</p>
                  )}

                  <div className="space-y-2 mt-5 pt-4 border-t border-slate-800/60 text-sm text-slate-300">
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

                <div className="mt-6 pt-4 border-t border-slate-850 flex gap-2">
                  <Link
                    to={`/ys/e/${ys.event_code || ys.id}`}
                    className="flex-1 min-h-[48px] bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-slate-200 hover:text-slate-50 font-semibold rounded-xl flex items-center justify-center transition duration-150 border border-slate-700/50"
                  >
                    View Event
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
