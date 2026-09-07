import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import React, { useEffect } from "react";
import type { LucideIcon } from "lucide-react";

export type BannerVariant = "info" | "warning" | "error" | "success";

export interface BannerProps {
  message: React.ReactNode;
  variant?: BannerVariant;
  onClose?: () => void;
  autoDismiss?: boolean;
  dismissDuration?: number;
  className?: string;
  isFloating?: boolean;
}

const VARIANT_MAP: Record<
  BannerVariant,
  {
    classes: string;
    icon: LucideIcon;
  }
> = {
  info: {
    classes: "bg-accent-blue border-accent-blue text-canvas",
    icon: Info,
  },
  warning: {
    classes: "bg-amber-500 border-amber-600 text-slate-950",
    icon: AlertTriangle,
  },
  error: {
    classes: "bg-rose-500 border-rose-600 text-white",
    icon: AlertCircle,
  },
  success: {
    classes: "bg-emerald-500 border-emerald-600 text-white",
    icon: CheckCircle,
  },
};

export const Banner: React.FC<BannerProps> = ({
  message,
  variant = "info",
  onClose,
  autoDismiss = true,
  dismissDuration = 3000,
  className = "",
  isFloating = false,
}) => {
  const { classes, icon: Icon } = VARIANT_MAP[variant];

  useEffect(() => {
    if (!autoDismiss || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, dismissDuration);
    return () => clearTimeout(timer);
  }, [autoDismiss, dismissDuration, onClose]);

  const baseStyles = "border px-6 py-4 rounded-lg flex items-center justify-between gap-3 shadow-lg animate-slide-down transition-all duration-300";
  const positionStyles = isFloating
    ? "fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[calc(100%-2rem)]"
    : "w-full";

  return (
    <div
      role="alert"
      className={`${baseStyles} ${positionStyles} ${classes} ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className="h-6 w-6 shrink-0" />
        <div className="text-base font-medium">{message}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current hover:opacity-80 p-0.5 rounded transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Close notification"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
};
