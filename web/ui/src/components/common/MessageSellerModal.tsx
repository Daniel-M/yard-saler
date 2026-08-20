import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface MessageSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  productId: string;
  onSend: (message: string) => Promise<void>;
  isLoading: boolean;
}

export const MessageSellerModal: React.FC<MessageSellerModalProps> = ({
  isOpen,
  onClose,
  productName,
  productId,
  onSend,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage("");
      setError(null);
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex="0"]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError(t("yard_sale.product.message_empty"));
      return;
    }
    try {
      await onSend(message);
      onClose();
    } catch (err: any) {
      setError(err?.message || t("yard_sale.product.message_send_failed"));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-lg bg-surface border border-border-subtle rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-border-subtle flex justify-between items-center">
          <h3 id="modal-title" className="text-xl font-bold text-content-primary">
            {t("yard_sale.product.message_seller_title")}
          </h3>
          <button
            onClick={onClose}
            className="text-content-secondary hover:text-content-primary transition p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue"
            aria-label={t("yard_sale.product.close_dialog")}
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <span className="block text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1">
              {t("yard_sale.product.summary_label")}
            </span>
            <div className="bg-canvas/55 p-3 rounded-lg border border-border-subtle text-content-primary">
              {productName}
            </div>
          </div>
          <div>
            <label
              htmlFor="message-text"
              className="block text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2"
            >
              {t("yard_sale.product.your_message_label")}
            </label>
            <textarea
              id="message-text"
              ref={firstInputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={4}
              placeholder={t("yard_sale.product.message_placeholder")}
              className="w-full bg-canvas border border-border-subtle rounded-xl p-3 text-content-primary placeholder-content-muted focus:outline-none focus:border-border-interactive focus:ring-1 focus:ring-border-interactive transition disabled:opacity-50 resize-none"
            />
          </div>
          {error && <div className="text-sm text-rose-500">{error}</div>}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-surface-elevated hover:bg-surface active:bg-surface-elevated text-content-primary font-semibold rounded-xl transition min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
            >
              {t("common.buttons.cancel")}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-accent-blue hover:bg-accent-blue-hover active:bg-accent-blue/80 text-black font-bold rounded-xl transition min-h-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue flex items-center justify-center cursor-pointer"
            >
              {isLoading ? (
                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
              ) : (
                t("yard_sale.product.message_seller")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
