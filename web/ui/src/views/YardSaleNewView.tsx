import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { apiClient } from "@services/api/client";
import { ArrowLeft } from "lucide-react";

export const YardSaleNewView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Convert local datetime input to ISO 8601 UTC strings
    const startISO = new Date(startDate).toISOString();
    const endISO = new Date(endDate).toISOString();

    try {
      const response = await apiClient<{ id: string; event_code: string }>("/api/yard-sales", {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          location,
          start_date: startISO,
          end_date: endISO,
        }),
      });

      if (response && (response.event_code || response.id)) {
        navigate(`/ys/e/${response.event_code || response.id}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create yard sale");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/user/dashboard");
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <button
          onClick={handleCancel}
          className="inline-flex min-h-[48px] items-center gap-2 text-slate-400 hover:text-slate-200 font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-slate-50 mb-6">
          {t("yard_sale.create.title")}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              {t("yard_sale.create.eventTitle")}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              {t("yard_sale.create.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none h-24 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-1.5">
              {t("yard_sale.create.location")}
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                {t("yard_sale.create.startDate")}
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none transition"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                {t("yard_sale.create.endDate")}
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none transition"
                required
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 min-h-[48px] bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-slate-50 font-bold rounded-xl transition duration-150 flex items-center justify-center cursor-pointer border border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] min-h-[48px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-slate-950 font-bold rounded-xl transition duration-150 flex items-center justify-center cursor-pointer transform hover:scale-[1.01]"
            >
              {isSubmitting ? "Creating..." : t("yard_sale.create.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default YardSaleNewView;
