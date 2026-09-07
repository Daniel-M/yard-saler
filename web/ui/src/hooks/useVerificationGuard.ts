import { useAuth } from "@context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useUserProfile } from "./useUserProfile";

export interface UseVerificationGuardOptions {
  allowedStatus?: "any" | "verified" | "unverified";
}

export const useVerificationGuard = (options: UseVerificationGuardOptions = {}) => {
  const { token, user, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { fetchProfile, isLoading: isProfileLoading } = useUserProfile();
  const [checking, setChecking] = useState(true);

  const allowedStatus = options.allowedStatus ?? "unverified";

  useEffect(() => {
    if (!token) {
      setToken(null);
      navigate("/auth/login", { replace: true, state: { from: location.pathname } });
      return;
    }

    const checkStatus = async () => {
      try {
        let currentUser = user;
        if (!currentUser) {
          currentUser = await fetchProfile();
        }

        if (!currentUser) {
          setToken(null);
          navigate("/auth/login", { replace: true, state: { from: location.pathname } });
          return;
        }

        const isVerified = (currentUser as any).isVerified || (currentUser as any).is_verified;
        const profileComplete =
          currentUser.profile_complete ||
          (!!currentUser.firstName && !!currentUser.lastName) ||
          (!!(currentUser as any).first_name && !!(currentUser as any).last_name);

        if (allowedStatus === "unverified") {
          // Used on VerifyPage: we expect them to be unverified.
          // If they are already verified, redirect them away.
          if (isVerified) {
            if (profileComplete) {
              navigate("/user/dashboard", { replace: true });
            } else {
              navigate("/user/register", { replace: true });
            }
          } else {
            setChecking(false);
          }
        } else {
          // Used on protected routes (like Dashboard): we expect them to be verified.
          // If they are not verified, redirect to verification page.
          if (!isVerified) {
            navigate("/auth/verify", { replace: true });
            return;
          }

          // If profile is not complete, redirect to register/details page.
          if (!profileComplete && location.pathname !== "/user/register") {
            navigate("/user/register", { replace: true });
            return;
          }

          // If everything is fine, stop checking and let them render.
          setChecking(false);
        }
      } catch (err) {
        console.error("Error checking verification status:", err);
        setToken(null);
        navigate("/auth/login", { replace: true });
      }
    };

    checkStatus();
  }, [token, user, fetchProfile, navigate, allowedStatus, location.pathname, setToken]);

  return { checking, isProfileLoading };
};
