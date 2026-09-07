import React, { useEffect, useState } from 'react';
import { useNavigate, Outlet, useLocation } from "react-router";
import { useAuth } from '@context/AuthContext';
import { useUserProfile } from '@hooks/useUserProfile';
import { DrawerLayout } from '@layouts/DrawerLayout';
import { DrawerProvider } from '@context/DrawerContext';

export default function DashboardRoute() {
  const { token, setToken, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile } = useUserProfile();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setToken(null);
      setLoading(false);
      navigate('/login', { replace: true, state: { from: location.pathname } });
      return;
    }

    let isMounted = true;

    const fetchUserProfile = async () => {
      try {
        const profile = await fetchProfile();
        if (isMounted) {
          if (profile) {
            if (!profile.firstName || !profile.lastName) {
              setLoading(false);
              navigate('/edit-details', { replace: true });
              return;
            }
            setLoading(false);
          } else {
            setToken(null);
            setLoading(false);
            navigate('/login', { replace: true, state: { from: location.pathname } });
          }
        }
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
        if (isMounted) {
          setToken(null);
          setLoading(false);
          navigate('/login', { replace: true, state: { from: location.pathname } });
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [token, navigate, location.pathname, setToken, fetchProfile]);

  const handleLogout = () => {
    setToken(null);
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" data-testid="loading-skeleton">
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
