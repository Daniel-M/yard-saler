import { ProductCard } from "@components/common/ProductCard";
import type { Product } from "@components/common/ProductCard";
import { useAuth } from "@context/AuthContext";
import { apiClient } from "@services/api/client";
import { ArrowLeft, Calendar, MapPin, Plus, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";

interface YardSaleDetail {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  location: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  products: Product[];
}

export const YardSaleDetailView: React.FC = () => {
  const { event_code } = useParams<{ event_code: string }>();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [yardSale, setYardSale] = useState<YardSaleDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ysData = await apiClient<YardSaleDetail>(
          `/api/public/ys/e/${event_code}`,
        );
        setYardSale(ysData);
      } catch (err: any) {
        setError(err?.message || t("yard_sale.detail.detail_error"));
      } finally {
        setIsLoading(false);
      }
    };

    if (event_code) {
      fetchData();
    }
  }, [event_code, t]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-accent-blue">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue" />
      </div>
    );
  }

  if (error || !yardSale) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded p-4 mb-4">
          {error || t("yard_sale.detail.not_found")}
        </div>
        <Link
          to="/user/dashboard"
          className="inline-flex min-h-[48px] items-center gap-2 text-accent-blue hover:text-accent-blue-hover font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("yard_sale.product.back_to_dashboard")}
        </Link>
      </div>
    );
  }

  const isOwner = user && yardSale.user_id === user.id ? true : false;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
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
        style:
          "bg-surface-elevated text-content-secondary border border-border-subtle",
      };
    }
  };

  const status = getEventStatus(yardSale.start_date, yardSale.end_date);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
      <div>
        <Link
          to={user ? "/user/dashboard" : "/"}
          className="inline-flex min-h-[48px] items-center gap-2 text-content-secondary hover:text-content-primary font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded p-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {user
            ? t("yard_sale.product.back_to_dashboard")
            : t("yard_sale.product.back_to_home")}
        </Link>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl shadow-xl p-6 relative overflow-hidden">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${status.style}`}
              >
                {status.label}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-content-primary">
              {yardSale.title}
            </h2>
            {yardSale.description && (
              <p className="text-content-secondary leading-relaxed max-w-3xl">
                {yardSale.description}
              </p>
            )}
          </div>
          {isOwner && (
            <Link
              to={`/ys/e/${event_code || yardSale.id}/products/new`}
              className="min-h-[48px] bg-accent-blue hover:bg-accent-blue-hover text-black font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition duration-150 shadow-md transform hover:scale-[1.01]"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
              {t("yard_sale.detail.addProduct")}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-border-subtle text-content-secondary">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-canvas rounded-xl">
              <Calendar className="h-5 w-5 text-accent-blue shrink-0" />
            </div>
            <div className="text-sm">
              <span className="block font-semibold text-content-secondary">
                {t("yard_sale.detail.schedule")}
              </span>
              <span className="text-content-primary">
                {formatDate(yardSale.start_date)} -{" "}
                {formatDate(yardSale.end_date)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-canvas rounded-xl">
              <MapPin className="h-5 w-5 text-accent-blue shrink-0" />
            </div>
            <div className="text-sm">
              <span className="block font-semibold text-content-secondary">
                {t("yard_sale.detail.location")}
              </span>
              <span className="text-content-primary">{yardSale.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-canvas rounded-xl">
              <User className="h-5 w-5 text-accent-blue shrink-0" />
            </div>
            <div className="text-sm">
              <span className="block font-semibold text-content-secondary">
                {t("yard_sale.detail.host_id")}
              </span>
              <span className="truncate text-content-primary font-mono">
                {yardSale.user_id}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold text-content-primary mb-6 flex items-center gap-2">
          <span>{t("yard_sale.detail.listed_items")}</span>
          <span className="text-sm font-semibold text-content-secondary bg-surface-elevated px-2 py-0.5 rounded-full">
            {yardSale.products ? yardSale.products.length : 0}
          </span>
        </h3>
        {!yardSale.products || yardSale.products.length === 0 ? (
          <div className="bg-surface border border-border-subtle rounded-2xl shadow-xl p-12 text-center text-content-muted max-w-md mx-auto">
            <p className="font-semibold text-content-secondary">
              {t("yard_sale.detail.noProducts")}
            </p>
            {isOwner && (
              <Link
                to={`/ys/e/${event_code || yardSale.id}/products/new`}
                className="mt-4 inline-flex min-h-[48px] bg-accent-blue hover:bg-accent-blue-hover text-black font-bold px-6 py-2.5 rounded-xl transition duration-150"
              >
                {t("yard_sale.detail.add_first_product")}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {yardSale.products
              .filter((product) => isOwner || product.status !== "sold")
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    ...product,
                    product_code: product.id,
                  }}
                  eventCode={event_code || yardSale.id}
                  isOwner={isOwner}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default YardSaleDetailView;
