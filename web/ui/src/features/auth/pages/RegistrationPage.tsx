import { useAuth } from "@context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { RegistrationDetailsView } from "../views/RegistrationDetailsView";
import { useUserProfile } from "@hooks/useUserProfile";

export default function RegistrationPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { fetchProfile, isLoading: isProfileLoading } = useUserProfile();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/auth/login", { replace: true });
      return;
    }

    const checkStatus = async () => {
      try {
        let currentUser = user;
        if (!currentUser) {
          currentUser = await fetchProfile();
        }

        if (!currentUser) {
          navigate("/auth/login", { replace: true });
          return;
        }

        const isVerified = (currentUser as any).isVerified || (currentUser as any).is_verified;
        const profileComplete = currentUser.profile_complete;

        if (!isVerified) {
          navigate("/auth/verify", { replace: true });
        } else if (profileComplete) {
          navigate("/user/dashboard", { replace: true });
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error("Error checking registration status:", err);
        navigate("/auth/login", { replace: true });
      }
    };

    checkStatus();
  }, [token, user, fetchProfile, navigate]);

  if (checking || isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" data-testid="loading-skeleton">
        <div className="h-6 w-6 border-2 border-slate-700 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  return <RegistrationDetailsView />;
}
