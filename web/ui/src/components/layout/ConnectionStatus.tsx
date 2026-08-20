import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export const ConnectionStatus: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "online" | "offline">("loading");

  const checkHealth = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiBaseUrl}/health`, { method: "GET" });
      if (response.ok) {
        setStatus("online");
      } else {
        setStatus("offline");
      }
    } catch {
      setStatus("offline");
    }
  };

  useEffect(() => {
    checkHealth();

    const interval = setInterval(checkHealth, 30000);

    const handleOnline = () => {
      checkHealth();
    };
    const handleOffline = () => {
      setStatus("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-2 min-h-[48px] min-w-[48px]" aria-label="Checking connection status">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-pulse ring-2 ring-slate-900" />
      </div>
    );
  }

  const isOnline = status === "online";

  return (
    <div
      className="flex items-center justify-center p-2 min-h-[48px] min-w-[48px] cursor-help relative group"
      title={isOnline ? t("yard_sale.status.online") : t("yard_sale.status.offline")}
    >
      <span
        className={`w-2.5 h-2.5 rounded-full ring-2 ring-slate-900 ${
          isOnline ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      <span className="sr-only">
        {isOnline ? t("yard_sale.status.online") : t("yard_sale.status.offline")}
      </span>
    </div>
  );
};

export default ConnectionStatus;
