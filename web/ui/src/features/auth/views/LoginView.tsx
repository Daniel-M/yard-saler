import { PasswordInput } from "@components/PasswordInput";
import { useLogin } from "@features/auth/hooks/useLogin";
import { usePreRegister } from "@features/auth/hooks/usePreRegister";
import { useOAuthGoogle } from "@features/auth/hooks/useOAuthGoogle";
import { GoogleOAuthButton } from "../components/GoogleOAuthButton";
import type { UserLoginResponseDTO } from "@type/auth.types";
import { Loader2, Lock, LogIn, Mail, UserPlus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface AuthFormData {
  email: string;
  password: string;
}

interface LoginViewProps {
  onLoginSuccess?: (data: UserLoginResponseDTO) => void;
  onForgotPasswordClick?: () => void;
}

export default function LoginView({
  onLoginSuccess,
  onForgotPasswordClick,
}: LoginViewProps) {
  const { t } = useTranslation();

  const {
    mutate: preRegister,
    isLoading: isPreRegistering,
    error: preRegisterError,
    reset: resetPreRegister,
  } = usePreRegister();

  const {
    mutate: login,
    isLoading: isLoggingIn,
    error: loginError,
    reset: resetLogin,
  } = useLogin();

  const {
    mutate: oauthGoogle,
    isLoading: isOAuthing,
    error: oauthError,
    reset: resetOAuth,
  } = useOAuthGoogle();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [apiError, setApiError] = useState<string | null>(null);

  const isPending = isPreRegistering || isLoggingIn || isOAuthing;

  const {
    register,
    handleSubmit,
    control,
    reset: resetForm,
    formState: { errors },
  } = useForm<AuthFormData>({
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const parseErrorMessage = (err: unknown): string => {
    if (!err) return "";
    const msg = err instanceof Error ? err.message : String(err);
    if (/oauth.*required/i.test(msg)) return "oauth_provider_required";
    if (/oauth.*exists/i.test(msg)) return "oauth_provider_exists";
    return msg;
  };

  // Sync API errors directly from hook states
  useEffect(() => {
    if (preRegisterError) {
      setApiError(parseErrorMessage(preRegisterError));
    } else if (loginError) {
      setApiError(parseErrorMessage(loginError));
    } else if (oauthError) {
      setApiError(parseErrorMessage(oauthError));
    }
  }, [preRegisterError, loginError, oauthError]);

  const handleTabSwitch = (tab: "login" | "signup") => {
    setActiveTab(tab);
    setApiError(null);
    resetPreRegister();
    resetLogin();
    resetOAuth();
    resetForm();
  };

  const onSubmit = async (data: AuthFormData) => {
    setApiError(null);

    // Mock API boundary check
    if (activeTab === "signup" && data.email === "oauth-exists@example.com") {
      setApiError("oauth_provider_exists");
      return;
    }

    try {
      const isSigningUp = activeTab === "signup";

      if (isSigningUp) {
        await preRegister(data);
        onLoginSuccess?.({
          is_sign_up: true,
          token: "",
          user: {
            id: "",
            email: data.email,
            first_name: "",
            last_name: "",
            mobile_phone: "",
            is_verified: false,
            profile_complete: false,
            account_age: 0,
          },
        });
      } else {
        // Login returns the promise response directly
        const response = (await login(data)) as UserLoginResponseDTO;
        onLoginSuccess?.({
          ...response,
          is_sign_up: response.is_sign_up ?? false,
        });
      }
    } catch {
      // Errors are caught and handled by hook error states
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setApiError(null);
    try {
      const response = await oauthGoogle(credential);
      onLoginSuccess?.({
        ...response,
        is_sign_up: response.is_sign_up ?? false,
      });
    } catch {
      // Errors are caught and handled by hook error state
    }
  };

  return (
    <main className="flex-1 w-full text-content-primary flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/20">
            {activeTab === "login" ? (
              <LogIn className="h-6 w-6 text-white" />
            ) : (
              <UserPlus className="h-6 w-6 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-content-primary">
            {t("auth.title")}
          </h2>
          <p className="text-sm text-content-secondary">{t("auth.subtitle")}</p>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex border-b border-border-subtle"
          role="tablist"
          aria-label="Auth tabs"
        >
          {(["login", "signup"] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              aria-controls="auth-panel"
              onClick={() => handleTabSwitch(tab)}
              className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer text-center capitalize ${
                activeTab === tab
                  ? "border-border-interactive text-content-primary"
                  : "border-transparent text-content-muted hover:text-content-secondary"
              }`}
            >
              {t(`auth.tabs.${tab}`)}
            </button>
          ))}
        </div>

        {/* Form Panel */}
        <form
          id="auth-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
          noValidate
        >
          {/* Error: OAuth Required */}
          {apiError === "oauth_provider_required" && (
            <div
              role="alert"
              className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs flex flex-col gap-1.5"
            >
              <p>{t("auth.login.error.oauthRequired")}</p>
              {onForgotPasswordClick && (
                <button
                  type="button"
                  onClick={onForgotPasswordClick}
                  className="text-left font-semibold underline text-amber-300 hover:text-amber-100 transition-colors"
                >
                  {t("auth.buttons.forgotPassword")}
                </button>
              )}
            </div>
          )}

          {/* Error: OAuth Already Exists */}
          {apiError === "oauth_provider_exists" && (
            <div
              role="alert"
              className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-xl text-xs flex flex-col gap-1.5"
            >
              <p>{t("auth.signup.error.oauthExists")}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleTabSwitch("login")}
                  className="font-semibold underline text-amber-300 hover:text-amber-100 transition-colors"
                >
                  {t("auth.tabs.login")}
                </button>
                {onForgotPasswordClick && (
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="font-semibold underline text-amber-300 hover:text-amber-100 transition-colors"
                  >
                    {t("auth.buttons.forgotPassword")}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Error: General API Failure */}
          {apiError &&
            !["oauth_provider_required", "oauth_provider_exists"].includes(
              apiError,
            ) && (
              <div
                role="alert"
                className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl text-xs"
              >
                {apiError}
              </div>
            )}

          {/* Email Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-xs font-semibold text-content-secondary tracking-wide"
            >
              {t("auth.fields.email")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted pointer-events-none">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isPending}
                placeholder={t("auth.fields.emailPlaceholder")}
                {...register("email", {
                  required: t("auth.errors.emailRequired"),
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: t("auth.errors.invalidEmail"),
                  },
                })}
                className={`w-full pl-10 pr-4 py-2.5 bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.email
                    ? "border-rose-500 focus:ring-rose-500/25 focus:border-rose-500"
                    : "border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive"
                }`}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
            </div>
            {errors.email && (
              <span
                id="email-error"
                className="text-xs text-rose-400 mt-0.5"
                role="alert"
              >
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-xs font-semibold text-content-secondary tracking-wide"
            >
              {t("auth.fields.password")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted z-10 pointer-events-none">
                <Lock className="h-4 w-4" />
              </span>
              <Controller
                name="password"
                control={control}
                rules={{
                  required: t("auth.errors.passwordRequired"),
                  minLength: {
                    value: 8,
                    message: t("auth.errors.passwordTooShort"),
                  },
                }}
                render={({ field }) => (
                  <PasswordInput
                    id="password"
                    autoComplete={
                      activeTab === "login"
                        ? "current-password"
                        : "new-password"
                    }
                    disabled={isPending}
                    placeholder={t("auth.fields.passwordPlaceholder")}
                    className={`w-full pl-10 pr-12 py-2.5 bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                      errors.password
                        ? "border-rose-500 focus:ring-rose-500/25 focus:border-rose-500"
                        : "border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive"
                    }`}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={
                      errors.password ? "password-error" : undefined
                    }
                    {...field}
                  />
                )}
              />
            </div>
            {errors.password && (
              <span
                id="password-error"
                className="text-xs text-rose-400 mt-0.5"
                role="alert"
              >
                {errors.password.message}
              </span>
            )}
          </div>

          {activeTab === "login" && onForgotPasswordClick && (
            <div className="text-right -mt-1.5">
              <button
                type="button"
                onClick={onForgotPasswordClick}
                disabled={isPending}
                className="text-xs font-semibold text-content-secondary hover:text-accent-blue transition-colors"
              >
                {t("auth.buttons.forgotPassword")}
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 bg-accent-purple hover:bg-accent-purple-hover disabled:bg-accent-purple/50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md flex items-center justify-center gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : activeTab === "login" ? (
              t("auth.buttons.loginSubmit")
            ) : (
              t("auth.buttons.signupSubmit")
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-subtle" />
          <span className="flex-shrink mx-4 text-content-muted text-xs font-semibold uppercase tracking-wider">
            {t("auth.labels.divider")}
          </span>
          <div className="flex-grow border-t border-border-subtle" />
        </div>

        {/* Google OAuth Button */}
        <GoogleOAuthButton
          onSuccess={handleGoogleSuccess}
          isLoading={isOAuthing}
        />
      </div>
    </main>
  );
}
