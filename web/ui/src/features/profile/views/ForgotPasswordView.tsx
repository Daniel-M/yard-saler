import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { useForgotPassword } from "@features/auth/hooks/useForgotPassword";

export interface ForgotPasswordViewProps {
  onBackToLogin: () => void;
  onRecoveryInitiated?: (email: string) => void;
}

export default function ForgotPasswordView({
  onBackToLogin,
  onRecoveryInitiated,
}: ForgotPasswordViewProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    mutate: forgotPasswordMutate,
    isLoading,
    error: apiError,
    isSuccess,
  } = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setValidationError(t("recovery.errors.emailRequired"));
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError(t("recovery.errors.invalidEmail"));
      return;
    }

    try {
      await forgotPasswordMutate(trimmedEmail);
      if (onRecoveryInitiated) {
        onRecoveryInitiated(trimmedEmail);
      }
    } catch {
      // Error is handled by the hook
    }
  };

  const displayedError =
    validationError || (apiError ? t("recovery.errors.invalidEmail") : null);

  return (
    <main className="flex-1 w-full text-content-primary flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-150">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 transition-all duration-150">
        {isSuccess ? (
          <div
            className="flex flex-col items-center text-center gap-6 py-4"
            data-testid="success-state"
          >
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-content-primary">
                {t("recovery.success.title")}
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed">
                {t("recovery.success.message")}
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("recovery.buttons.backToLogin")}
            </button>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/20">
                <Mail className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-content-primary">
                {t("recovery.title")}
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed">
                {t("recovery.subtitle")}
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
              noValidate
            >
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold text-content-secondary tracking-wide"
                >
                  {t("recovery.fields.email")}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("recovery.fields.emailPlaceholder")}
                    className={`w-full pl-10 pr-4 py-2.5 bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                      displayedError
                        ? "border-rose-500 focus:ring-rose-500/25 focus:border-rose-500"
                        : "border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive"
                    }`}
                    aria-invalid={displayedError ? "true" : "false"}
                    aria-describedby={
                      displayedError ? "email-error" : undefined
                    }
                    disabled={isLoading}
                    required
                  />
                </div>
                {displayedError && (
                  <span
                    id="email-error"
                    className="text-xs text-rose-400 mt-0.5"
                    role="alert"
                  >
                    {displayedError}
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-accent-purple hover:bg-accent-purple-hover disabled:bg-accent-purple/50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  t("recovery.buttons.submit")
                )}
              </button>
            </form>

            {/* Back to Login Link/Button */}
            <button
              type="button"
              onClick={onBackToLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-surface-elevated text-content-secondary hover:text-content-primary font-semibold py-2 px-4 rounded-xl text-sm transition-all duration-150 cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("recovery.buttons.backToLogin")}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
