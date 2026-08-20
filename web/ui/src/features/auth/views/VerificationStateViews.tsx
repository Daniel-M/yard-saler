import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export const LoadingState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center text-center gap-6 py-6"
      data-testid="loading-state"
    >
      <div className="h-16 w-16 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shadow-lg shadow-accent-blue/10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-content-primary">
          {t("auth.verify.title")}
        </h2>
        <p className="text-sm text-content-secondary leading-relaxed animate-pulse">
          {t("auth.verify.loading")}
        </p>
      </div>
    </div>
  );
};

export const SuccessState: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center text-center gap-6 py-6"
      data-testid="success-state"
    >
      <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
        <CheckCircle className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-content-primary">
          {t("auth.verify.title")}
        </h2>
        <p className="text-sm text-content-secondary leading-relaxed">
          {t("auth.verify.success")}
        </p>
      </div>
    </div>
  );
};

interface IdleFormStateProps {
  isLoading: boolean;
  onSubmit: (code: string) => void;
  onExploreAsGuest: () => void;
  onBackToLogin: () => void;
}

export const IdleFormState: React.FC<IdleFormStateProps> = ({
  isLoading,
  onSubmit,
  onExploreAsGuest,
  onBackToLogin,
}) => {
  const { t } = useTranslation();
  const [manualCode, setManualCode] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setManualCode(val);
    if (val.length === 6 && !isLoading) {
      onSubmit(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length === 6 && !isLoading) {
      onSubmit(manualCode);
    }
  };

  return (
    <div className="flex flex-col gap-6 py-2" data-testid="idle-state">
      <div className="flex flex-col items-center text-center gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-content-primary">
          {t("auth.verify.title")}
        </h2>
        <p className="text-sm text-content-secondary leading-relaxed">
          {t("auth.verify.manual.description", "Enter the 6-digit code sent to your email.")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="verificationCode"
            className="text-xs font-semibold text-content-secondary tracking-wide"
          >
            {t("auth.verify.manual.label")}
          </label>
          <input
            id="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            pattern="\d{6}"
            value={manualCode}
            onChange={handleChange}
            placeholder={t("auth.verify.manual.placeholder")}
            className="w-full text-center tracking-[0.5em] text-lg font-bold py-2.5 bg-surface-elevated border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-border-interactive/25 focus:border-border-interactive transition-all duration-150 min-h-[48px]"
            required
          />
        </div>

        <button
          type="submit"
          disabled={manualCode.length !== 6 || isLoading}
          className="w-full bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
        >
          {t("auth.verify.manual.submit")}
        </button>
      </form>

      <div className="flex flex-col gap-3 mt-2">
        <button
          type="button"
          onClick={onExploreAsGuest}
          className="w-full flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
        >
          {t("auth.verify.exploreAsGuest")}
        </button>
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors cursor-pointer min-h-[36px]"
        >
          {t("auth.verify.error.backToLogin")}
        </button>
      </div>
    </div>
  );
};

interface ErrorStateProps {
  errorMsg: string | null;
  hasUrlCode: boolean;
  onRetry: () => void;
  onExploreAsGuest: () => void;
  onBackToLogin: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  errorMsg,
  hasUrlCode,
  onRetry,
  onExploreAsGuest,
  onBackToLogin,
}) => {
  const { t } = useTranslation();
  return (
    <div
      className="flex flex-col items-center text-center gap-6 py-6"
      data-testid="error-state"
    >
      <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
        <AlertCircle className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight text-content-primary">
          {t("auth.verify.error.title")}
        </h2>
        <p
          className="text-sm text-content-secondary leading-relaxed"
          role="alert"
        >
          {errorMsg}
        </p>
      </div>
      <div className="w-full flex flex-col gap-3 mt-4">
        <button
          type="button"
          onClick={onRetry}
          className="w-full bg-accent-purple hover:bg-accent-purple-hover text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
        >
          {t("auth.verify.error.retry")}
        </button>
        {!hasUrlCode && (
          <button
            type="button"
            onClick={onExploreAsGuest}
            className="w-full flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
          >
            {t("auth.verify.exploreAsGuest")}
          </button>
        )}
        <button
          type="button"
          onClick={onBackToLogin}
          className="w-full flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
        >
          {t("auth.verify.error.backToLogin")}
        </button>
      </div>
    </div>
  );
};
