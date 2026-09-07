import React, { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@context/ThemeContext";

declare global {
  interface Window {
    google?: any;
    __google_auth_initialized?: boolean;
  }
}

export interface GoogleOAuthButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  isLoading?: boolean;
}

export const GoogleOAuthButton: React.FC<GoogleOAuthButtonProps> = ({
  onSuccess,
  onError,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [googleAvailable, setGoogleAvailable] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.warn("VITE_GOOGLE_CLIENT_ID is not configured");
      setChecking(false);
      return;
    }

    const initButton = () => {
      if (!isMounted) return;
      if (window.google?.accounts?.id) {
        setGoogleAvailable(true);
        setChecking(false);

        // Always initialize Google Accounts with client ID
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response.credential) {
              onSuccess(response.credential);
            } else if (onError) {
              onError();
            }
          },
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(containerRef.current, {
            type: "standard",
            theme: theme === "dark" ? "filled_black" : "outline",
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: containerRef.current.clientWidth || 320,
          });
        }
      }
    };

    // Remove any existing script tag to force-reload with the new locale
    const existingScript = document.getElementById("google-gsi-client");
    if (existingScript) {
      existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = "google-gsi-client";
    script.src = `https://accounts.google.com/gsi/client?hl=${i18n.language || "es"}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initButton();
    };
    script.onerror = () => {
      if (isMounted) {
        setGoogleAvailable(false);
        setChecking(false);
      }
    };
    document.body.appendChild(script);

    return () => {
      isMounted = false;
    };
  }, [onSuccess, onError, i18n.language, theme]);

  if (!googleAvailable) {
    return (
      <div className="w-full p-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl text-xs text-center font-sans" role="alert">
        {t("auth.errors.googleBlocked")}
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center min-h-[44px] relative">
      {(checking || isLoading) && (
        <div className="absolute inset-0 w-full h-11 flex items-center justify-center bg-surface-elevated border border-border-subtle rounded-xl animate-pulse text-xs text-content-muted z-10">
          {t("common.loading")}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full flex justify-center"
        style={{ visibility: checking || isLoading ? "hidden" : "visible" }}
        data-testid="google-oauth-button-container"
      />
    </div>
  );
};
