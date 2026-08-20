import { useNavigate } from "react-router";
import { VerifyView } from "../views/VerifyView";
import { useVerificationGuard } from "../hooks/useVerificationGuard";
import type { LoggedUserDTO } from "@type/auth.types";

export default function VerifyPage() {
  const navigate = useNavigate();
  const { checking, isProfileLoading } = useVerificationGuard();

  const handleVerificationSuccess = (token: string, user: LoggedUserDTO) => {
    setTimeout(() => {
      if (user.profile_complete) {
        navigate("/user/dashboard", { replace: true });
      } else {
        navigate("/user/register", { replace: true });
      }
    }, 1500);
  };

  const handleVerificationError = (error: string) => {
    console.error("Verification failed:", error);
  };

  if (checking || isProfileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center" data-testid="loading-skeleton">
        <div className="h-6 w-6 border-2 border-slate-700 border-t-slate-200 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <VerifyView
      onVerificationSuccess={handleVerificationSuccess}
      onVerificationError={handleVerificationError}
    />
  );
}
