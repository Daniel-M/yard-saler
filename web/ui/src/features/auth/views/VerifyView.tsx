import React from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle } from "lucide-react";
import {
  useCodeVerification,
  type UseCodeVerificationOptions,
} from "@features/auth/hooks/useCodeVerification";
import {
  LoadingState,
  SuccessState,
  IdleFormState,
  ErrorState,
} from "./VerificationStateViews";

export type VerifyViewProps = UseCodeVerificationOptions;

export const VerifyView: React.FC<VerifyViewProps> = ({
  onVerificationSuccess,
  onVerificationError,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    codeFromUrl,
    errorMsg,
    performVerification,
    reset,
    showToast,
    status,
  } = useCodeVerification({
    onVerificationSuccess,
    onVerificationError,
  });

  const handleExploreAsGuest = () => {
    navigate("/dashboard");
  };

  const handleBackToLogin = () => {
    navigate("/auth/login");
  };

  return (
    <main className="flex-1 w-full text-content-primary flex justify-center items-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-150">
      {/* Toast Notification */}
      {showToast && (
        <div
          className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300"
          role="status"
          data-testid="signup-toast"
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">
            {t("auth.verify.toastSent")}
          </span>
        </div>
      )}

      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 transition-all duration-150">
        {status === "loading" && <LoadingState />}
        {status === "success" && <SuccessState />}
        {status === "idle" && (
          <IdleFormState
            isLoading={false}
            onSubmit={performVerification}
            onExploreAsGuest={handleExploreAsGuest}
            onBackToLogin={handleBackToLogin}
          />
        )}
        {status === "error" && (
          <ErrorState
            errorMsg={errorMsg}
            hasUrlCode={Boolean(codeFromUrl)}
            onRetry={reset}
            onExploreAsGuest={handleExploreAsGuest}
            onBackToLogin={handleBackToLogin}
          />
        )}
      </div>
    </main>
  );
};

export default VerifyView;
