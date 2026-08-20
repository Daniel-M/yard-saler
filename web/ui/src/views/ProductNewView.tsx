import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { apiClient } from "@services/api/client";
import { UploadCloud, Trash2, ArrowLeft } from "lucide-react";

export const ProductNewView: React.FC = () => {
  const { event_code } = useParams<{ event_code: string }>();
  const id = event_code;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [condition, setCondition] = useState<"new" | "like_new" | "good" | "fair" | "poor">("good");
  const [status, setStatus] = useState<"available" | "pending" | "sold">("available");
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl = import.meta.env.VITE_API_URL || "";

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const token = localStorage.getItem("token");

    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const headers = new Headers();
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        const response = await fetch(`${apiBaseUrl}/api/upload`, {
          method: "POST",
          headers,
          body: formData,
        });

        if (!response.ok) {
          throw new Error(t("yard_sale.product.upload_failed", { statusText: response.statusText }));
        }

        const data = await response.json();
        if (data.url) {
          setImages((prev) => [...prev, data.url]);
        }
      }
    } catch (err: any) {
      setError(err?.message || t("yard_sale.product.error_upload_image"));
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const priceInCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceInCents)) {
      setError(t("yard_sale.product.error_price"));
      setIsSubmitting(false);
      return;
    }

    try {
      await apiClient(`/api/yard-sales/${id}/products`, {
        method: "POST",
        body: JSON.stringify({
          name,
          description,
          price: priceInCents,
          condition,
          status,
          images,
        }),
      });

      navigate(`/ys/e/${id}`);
    } catch (err: any) {
      setError(err?.message || t("yard_sale.product.error_list_product"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith("/")) {
      return `${apiBaseUrl}${url}`;
    }
    return url;
  };

  const handleCancel = () => {
    navigate(`/ys/e/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <button
          onClick={handleCancel}
          className="inline-flex min-h-[48px] items-center gap-2 text-content-secondary hover:text-content-primary font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("yard_sale.product.back_to_event")}
        </button>
      </div>

      <div className="bg-surface border border-border-subtle rounded-2xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-content-primary mb-6">
          {t("yard_sale.product.createTitle")}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-content-secondary mb-1.5">
              {t("yard_sale.product.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-canvas border border-border-subtle text-content-primary rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-accent-blue outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-content-secondary mb-1.5">
              {t("yard_sale.create.description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-canvas border border-border-subtle text-content-primary rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-accent-blue outline-none h-24 transition resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-content-secondary mb-1.5">
                {t("yard_sale.product.price")}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full bg-canvas border border-border-subtle text-content-primary rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-accent-blue outline-none transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-content-secondary mb-1.5">
                {t("yard_sale.product.condition")}
              </label>
              <select
                value={condition}
                onChange={(e: any) => setCondition(e.target.value)}
                className="w-full bg-canvas border border-border-subtle text-content-primary rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-accent-blue outline-none min-h-[48px] transition cursor-pointer"
              >
                <option value="new">{t("yard_sale.product.conditions.new")}</option>
                <option value="like_new">{t("yard_sale.product.conditions.like_new")}</option>
                <option value="good">{t("yard_sale.product.conditions.good")}</option>
                <option value="fair">{t("yard_sale.product.conditions.fair")}</option>
                <option value="poor">{t("yard_sale.product.conditions.poor")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-content-secondary mb-1.5">
                {t("yard_sale.product.status")}
              </label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
                className="w-full bg-canvas border border-border-subtle text-content-primary rounded-xl p-3 focus-visible:ring-2 focus-visible:ring-accent-blue outline-none min-h-[48px] transition cursor-pointer"
              >
                <option value="available">{t("yard_sale.product.statuses.available")}</option>
                <option value="pending">{t("yard_sale.product.statuses.pending")}</option>
                <option value="sold">{t("yard_sale.product.statuses.sold")}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-content-secondary mb-1.5">
              {t("yard_sale.product.uploadImages")}
            </label>
            <div className="flex flex-col gap-4 border border-dashed border-border-subtle rounded-2xl p-5 bg-canvas">
              <label className="flex flex-col items-center justify-center gap-2 cursor-pointer p-4 min-h-[48px] hover:text-accent-blue transition">
                <UploadCloud className="h-8 w-8 text-content-muted" />
                <span className="text-sm font-bold text-content-secondary">{t("yard_sale.product.select_files")}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>

              {isUploading && (
                <div className="text-sm text-accent-blue text-center animate-pulse font-semibold">
                  {t("yard_sale.product.uploading_images")}
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-2">
                  {images.map((url, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-surface border border-border-subtle">
                      <img src={getFullImageUrl(url)} alt={t("yard_sale.product.preview_image", { index: idx + 1 })} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-150 text-red-500 min-h-[48px] min-w-[48px] cursor-pointer"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 min-h-[48px] bg-surface-elevated hover:bg-surface text-content-primary font-bold rounded-xl transition duration-150 flex items-center justify-center cursor-pointer border border-border-subtle"
            >
              {t("common.buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex-[2] min-h-[48px] bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-50 text-black font-bold rounded-xl transition duration-150 flex items-center justify-center cursor-pointer transform hover:scale-[1.01]"
            >
              {isSubmitting ? t("yard_sale.product.listing_product") : t("yard_sale.product.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductNewView;
