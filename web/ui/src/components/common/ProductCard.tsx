import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth } from "@context/AuthContext";
import { ImageCarousel } from "./ImageCarousel";
import { useCart } from "@hooks/useCart";
import { useWishlist } from "@hooks/useWishlist";
import { useMessageSeller } from "@hooks/useMessageSeller";
import { MessageSellerModal } from "./MessageSellerModal";
import { Heart, Mail, ShoppingCart, Minus, Plus } from "lucide-react";

export interface Product {
  id: string;
  yard_sale_id: string;
  name: string;
  description?: string;
  price: number; // in cents
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  status: 'available' | 'pending' | 'sold';
  images: string[];
  created_at: string;
  updated_at: string;
}

export interface ProductCardProps {
  product: Product & { product_code?: string };
  eventCode?: string;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, eventCode, onSelect }) => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  // Hooks
  const { cartItems, addToCart, updateQuantity, removeFromCart, isLoading: isCartLoading } = useCart();
  const { wishlistItems, toggleWishlist, isLoading: isWishlistLoading } = useWishlist();
  const { sendMessage, isLoading: isSendingMessage } = useMessageSeller();

  const cartItem = cartItems.find((item) => item.product_id === product.id);
  const isInCart = !!cartItem;
  const quantity = cartItem?.quantity || 0;

  const isWishlisted = wishlistItems.some((item) => item.product_id === product.id);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "available":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "pending":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "sold":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      default:
        return "bg-surface-elevated text-content-secondary border border-border-subtle";
    }
  };

  const apiBaseUrl = import.meta.env.VITE_API_URL || "";
  const formattedImages = (product.images || []).map((img) =>
    img.startsWith("/") ? `${apiBaseUrl}${img}` : img
  );

  const handleAuthCheck = (): boolean => {
    if (!token) {
      navigate("/auth/login");
      return false;
    }
    return true;
  };

  const handleCardClick = () => {
    const code = product.product_code || product.id;
    const evCode = eventCode || product.yard_sale_id;
    if (onSelect) {
      onSelect(product);
    } else {
      navigate(`/ys/e/${evCode}/p/${code}`);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!handleAuthCheck()) return;
    try {
      await addToCart(product.id, 1);
    } catch (err) {
      // Ignored
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateQuantity(product.id, quantity + 1);
    } catch (err) {
      // Ignored
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (quantity <= 1) {
        await removeFromCart(product.id);
      } else {
        await updateQuantity(product.id, quantity - 1);
      }
    } catch (err) {
      // Ignored
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!handleAuthCheck()) return;
    try {
      await toggleWishlist(product.id);
    } catch (err) {
      // Ignored
    }
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!handleAuthCheck()) return;
    setIsMessageModalOpen(true);
  };

  const handleMessageSubmit = async (messageText: string) => {
    try {
      await sendMessage({ product_id: product.id, message: messageText });
    } catch (err: any) {
      throw err;
    }
  };

  return (
    <>
      <article
        role="article"
        className="bg-surface border border-border-subtle rounded-lg shadow-xl overflow-hidden hover:border-border-interactive transition duration-150 flex flex-col h-full cursor-pointer"
        onClick={handleCardClick}
      >
        <ImageCarousel images={formattedImages} />
        <div className="p-4 flex flex-col flex-1 justify-between gap-4">
          <div>
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-lg font-bold text-content-primary truncate">{product.name}</h4>
              <span className="text-lg font-bold text-accent-blue shrink-0">
                {formatCurrency(product.price)}
              </span>
            </div>
            {product.description && (
              <p className="text-content-secondary text-sm mt-1 line-clamp-2">{product.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 mt-auto">
            <span className="text-xs font-semibold text-content-primary bg-surface-elevated px-2 py-1 rounded">
              {t(`yard_sale.product.conditions.${product.condition}`)}
            </span>
            <span className={`text-xs font-semibold px-2 py-1 rounded capitalize ${getStatusStyle(product.status)}`}>
              {t(`yard_sale.product.statuses.${product.status}`)}
            </span>
          </div>

          <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
            {isInCart ? (
              <div className="flex items-center bg-canvas border border-border-subtle rounded-lg overflow-hidden h-9">
                <button
                  onClick={handleDecrement}
                  disabled={isCartLoading}
                  className="w-8 h-full flex items-center justify-center text-content-secondary hover:text-content-primary transition focus-visible:outline-none hover:bg-surface"
                  aria-label={t("yard_sale.product.decrease_quantity")}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="px-2 text-content-primary font-bold text-sm min-w-[24px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  disabled={isCartLoading}
                  className="w-8 h-full flex items-center justify-center text-content-secondary hover:text-content-primary transition focus-visible:outline-none hover:bg-surface"
                  aria-label={t("yard_sale.product.increase_quantity")}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={isCartLoading || product.status !== "available"}
                className="flex-1 min-h-[36px] bg-accent-blue hover:bg-accent-blue-hover active:bg-accent-blue/80 disabled:bg-surface-elevated disabled:text-content-muted text-black text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {product.status === "available" ? t("yard_sale.product.add_to_cart") : t("yard_sale.product.unavailable")}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleToggleWishlist}
                disabled={isWishlistLoading}
                className="w-9 h-9 bg-surface-elevated hover:bg-surface active:bg-surface-elevated border border-border-subtle rounded-lg flex items-center justify-center transition focus-visible:outline-none"
                aria-label={isWishlisted ? t("yard_sale.product.remove_from_wishlist") : t("yard_sale.product.add_to_wishlist")}
              >
                <Heart
                  className={`h-4 w-4 transition ${
                    isWishlisted ? "fill-rose-500 text-rose-500" : "text-content-secondary hover:text-content-primary"
                  }`}
                />
              </button>
              <button
                onClick={handleMessageClick}
                disabled={isSendingMessage}
                className="w-9 h-9 bg-surface-elevated hover:bg-surface active:bg-surface-elevated border border-border-subtle rounded-lg flex items-center justify-center transition focus-visible:outline-none"
                aria-label={t("yard_sale.product.message_seller")}
              >
                <Mail className="h-4 w-4 text-content-secondary hover:text-content-primary" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <MessageSellerModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        productId={product.id}
        productName={product.name}
        onSend={handleMessageSubmit}
        isLoading={isSendingMessage}
      />
    </>
  );
};
