import { useAuth } from "@context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useUserProfile } from "./useUserProfile";

export const useVerificationGuard = () => {
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

        if (isVerified) {
          if (profileComplete) {
            navigate("/user/dashboard", { replace: true });
          } else {
            navigate("/user/register", { replace: true });
          }
        } else {
          setChecking(false);
        }
      } catch (err) {
        console.error("Error checking verification status:", err);
        navigate("/auth/login", { replace: true });
      }
    };

    checkStatus();
  }, [token, user, fetchProfile, navigate]);

  return { checking, isProfileLoading };
};
