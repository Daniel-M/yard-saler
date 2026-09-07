import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { DrawerLayout } from "@layouts/DrawerLayout";
import { useAuth } from "@context/AuthContext";
import { DrawerProvider } from "@context/DrawerContext";
import { useUserProfile } from "@hooks/useUserProfile";

export default function DashboardRoute() {
  const { token, setToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useUserProfile();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile().finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    setToken(null);
    navigate("/login");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex items-center justify-center"
        data-testid="loading-skeleton"
      >
        <div className="h-6 w-6 border-2 border-slate-700 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DrawerProvider>
      <DrawerLayout onLogout={handleLogout}>
        <Outlet />
      </DrawerLayout>
    </DrawerProvider>
  );
}
