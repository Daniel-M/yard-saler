import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@context/AuthContext";
import { apiClient } from "@services/api/client";
import { ImageCarousel } from "@components/common/ImageCarousel";
import { useCart } from "@hooks/useCart";
import { useWishlist } from "@hooks/useWishlist";
import { useMessageSeller } from "@hooks/useMessageSeller";
import { MessageSellerModal } from "@components/common/MessageSellerModal";
import { ArrowLeft, Heart, Mail, ShoppingCart, Minus, Plus } from "lucide-react";
import type { Product } from "@components/common/ProductCard";

export const ProductDetailView: React.FC = () => {
  const { event_code, product_code } = useParams<{ event_code: string; product_code: string }>();
  const { t } = useTranslation();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  // Hooks
  const { cartItems, addToCart, updateQuantity, removeFromCart, isLoading: isCartLoading } = useCart();
  const { wishlistItems, toggleWishlist, isLoading: isWishlistLoading } = useWishlist();
  const { sendMessage, isLoading: isSendingMessage } = useMessageSeller();

  // Load product detail
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiClient<Product>(`/api/public/ys/e/${event_code}/p/${product_code}`);
        setProduct(data);
      } catch (err: any) {
        setError(err?.message || t("yard_sale.product.detail_error"));
      } finally {
        setIsLoading(false);
      }
    };

    if (product_code && event_code) {
      fetchProduct();
    }
  }, [product_code, event_code, t]);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAuthCheck = (): boolean => {
    if (!token) {
      navigate("/auth/login");
      return false;
    }
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64 text-accent-blue">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded p-4 mb-4">
          {error || t("yard_sale.product.not_found")}
        </div>
        <Link
          to={`/ys/e/${event_code}`}
          className="inline-flex min-h-[48px] items-center gap-2 text-accent-blue hover:text-accent-blue-hover font-semibold transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("yard_sale.product.back_to_event")}
        </Link>
      </div>
    );
  }

  const cartItem = cartItems.find((item) => item.product_id === product.id);
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;

  const isWishlisted = wishlistItems.some((item) => item.product_id === product.id);

  const handleAddToCart = async () => {
    if (!handleAuthCheck()) return;
    try {
      await addToCart(product.id, 1);
      showToast(t("yard_sale.product.added_to_cart"));
    } catch (err: any) {
      showToast(err?.message || t("yard_sale.product.add_to_cart_error"), "error");
    }
  };

  const handleIncrement = async () => {
    try {
      await updateQuantity(product.id, quantity + 1);
      showToast(t("yard_sale.product.cart_updated"));
    } catch (err: any) {
      showToast(err?.message || t("yard_sale.product.cart_update_error"), "error");
    }
  };

  const handleDecrement = async () => {
    try {
      if (quantity <= 1) {
        await removeFromCart(product.id);
        showToast(t("yard_sale.product.removed_from_cart"));
      } else {
        await updateQuantity(product.id, quantity - 1);
        showToast(t("yard_sale.product.cart_updated"));
      }
    } catch (err: any) {
      showToast(err?.message || t("yard_sale.product.cart_update_error"), "error");
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!handleAuthCheck()) return;
    try {
      await toggleWishlist(product.id);
      showToast(isWishlisted ? t("yard_sale.product.removed_from_wishlist") : t("yard_sale.product.added_to_wishlist"));
    } catch (err: any) {
      showToast(err?.message || t("yard_sale.product.wishlist_update_error"), "error");
    }
  };

  const handleMessageSubmit = async (messageText: string) => {
    try {
      await sendMessage({ product_id: product.id, message: messageText });
      showToast(t("yard_sale.product.message_sent"));
    } catch (err: any) {
      throw err;
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const formattedImages = (product.images || []).map((img) =>
    img.startsWith("/") ? `${apiBaseUrl}${img}` : img
  );

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 relative">
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm shadow-2xl transition duration-300 ${
            toastType === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-rose-500/10 border-rose-500/20 text-rose-400"
          }`}
        >
          {toastMessage}
        </div>
      )}

      <div>
        <Link
          to={`/ys/e/${event_code}`}
          className="inline-flex min-h-[48px] items-center gap-2 text-content-secondary hover:text-content-primary font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded p-1"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("yard_sale.product.back_to_event")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-surface border border-border-subtle rounded-2xl shadow-xl p-6 overflow-hidden">
        <div className="rounded-xl overflow-hidden bg-canvas border border-border-subtle aspect-video md:aspect-square flex items-center justify-center">
          <ImageCarousel images={formattedImages} />
        </div>

        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <h2 className="text-3xl font-extrabold text-content-primary">{product.name}</h2>
              <span className="text-3xl font-extrabold text-accent-blue shrink-0">
                {formatCurrency(product.price)}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="text-xs font-semibold text-content-secondary bg-surface-elevated px-2.5 py-1 rounded">
                {t("yard_sale.product.condition_label")}: <span className="text-content-primary capitalize">{t(`yard_sale.product.conditions.${product.condition}`)}</span>
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded capitalize bg-surface-elevated text-content-primary`}>
                {t("yard_sale.product.status_label")}: <span className="capitalize">{t(`yard_sale.product.statuses.${product.status}`)}</span>
              </span>
            </div>

            {product.description && (
              <div className="pt-2">
                <span className="block text-xs font-semibold text-content-muted uppercase tracking-wider mb-1">
                  {t("yard_sale.product.description_label")}
                </span>
                <p className="text-content-secondary leading-relaxed text-sm">{product.description}</p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-3">
              {isInCart ? (
                <div className="flex items-center bg-canvas border border-border-subtle rounded-xl overflow-hidden h-12">
                  <button
                    onClick={handleDecrement}
                    disabled={isCartLoading}
                    className="w-12 h-full flex items-center justify-center text-content-secondary hover:text-content-primary transition focus-visible:outline-none hover:bg-surface"
                    aria-label={t("yard_sale.product.decrease_quantity")}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 text-content-primary font-bold text-lg min-w-[40px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={isCartLoading}
                    className="w-12 h-full flex items-center justify-center text-content-secondary hover:text-content-primary transition focus-visible:outline-none hover:bg-surface"
                    aria-label={t("yard_sale.product.increase_quantity")}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isCartLoading || product.status !== "available"}
                  className="flex-1 min-h-[48px] bg-accent-blue hover:bg-accent-blue-hover active:bg-accent-blue/80 disabled:bg-surface-elevated disabled:text-content-muted text-black font-bold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition duration-150 shadow-md cursor-pointer"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.status === "available" ? t("yard_sale.product.add_to_cart") : t("yard_sale.product.unavailable")}
                </button>
              )}

              <button
                onClick={handleToggleWishlist}
                disabled={isWishlistLoading}
                className="w-12 h-12 bg-surface-elevated hover:bg-surface active:bg-surface-elevated rounded-xl flex items-center justify-center transition border border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
                aria-label={isWishlisted ? t("yard_sale.product.remove_from_wishlist") : t("yard_sale.product.add_to_wishlist")}
              >
                <Heart
                  className={`h-5 w-5 transition ${
                    isWishlisted ? "fill-rose-500 text-rose-500" : "text-content-secondary hover:text-content-primary"
                  }`}
                />
              </button>

              <button
                onClick={() => handleAuthCheck() && setIsMessageModalOpen(true)}
                disabled={isSendingMessage}
                className="w-12 h-12 bg-surface-elevated hover:bg-surface active:bg-surface-elevated rounded-xl flex items-center justify-center transition border border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
                aria-label={t("yard_sale.product.message_seller")}
              >
                <Mail className="h-5 w-5 text-content-secondary hover:text-content-primary" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <MessageSellerModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        productId={product.id}
        productName={product.name}
        onSend={handleMessageSubmit}
        isLoading={isSendingMessage}
      />
    </div>
  );
};

export default ProductDetailView;
