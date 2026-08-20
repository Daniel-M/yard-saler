import { useAuth } from "@context/AuthContext";
import { useEditDetails } from "@features/auth/hooks/useEditDetails";
import { AlertCircle, Loader2, MapPin, Phone, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router";

export interface RegistrationDetailsProps {
  onRegistrationComplete?: () => void;
  defaultEmail?: string;
}

export function RegistrationDetailsView({
  onRegistrationComplete,
  defaultEmail,
}: RegistrationDetailsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: editDetailsMutate } = useEditDetails();
  const { user, setUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [locationVal, setLocationVal] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    location?: string;
    api?: string;
  }>({});
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const token =
      localStorage.getItem("paseto_token") ||
      localStorage.getItem("token") ||
      "";
    if (!token) {
      navigate("/auth/login", { replace: true });
      return;
    }

    if (location.pathname === "/user/register") {
      const status = localStorage.getItem("user_status");
      if (status === "VERIFIED_COMPLETE") {
        navigate("/user/dashboard", { replace: true });
      }
    }
  }, [navigate, location.pathname]);

  useEffect(() => {
    if (user && !hasInitialized) {
      const name =
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.displayName || "";
      setFullName(name);
      setLocationVal(user.socials || "");
      setPhone(user.mobilePhone || "");
      setHasInitialized(true);
    }
  }, [user, hasInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { fullName?: string; location?: string; api?: string } =
      {};

    if (!fullName.trim()) {
      newErrors.fullName = t("auth.registerDetails.errors.fullNameRequired");
    }
    if (!locationVal.trim()) {
      newErrors.location = t("auth.registerDetails.errors.locationRequired");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || ".";

      const response = await editDetailsMutate({
        firstName,
        lastName,
        mobilePhone: phone,
        socials: locationVal ? [locationVal] : [],
      });

      if (response) {
        setUser({
          id: response.id,
          displayName: `${response.first_name} ${response.last_name}`.trim(),
          email: response.email,
          initials:
            (
              (response.first_name?.[0] || "") + (response.last_name?.[0] || "")
            ).toUpperCase() || response.email[0].toUpperCase(),
          avatarUrl: user?.avatarUrl,
          firstName: response.first_name,
          lastName: response.last_name,
          mobilePhone: response.mobile_phone,
          socials: response.socials,
          isVerified: response.verified_at != null,
          createdAt: response.created_at,
          updatedAt: response.updated_at,
          verifiedAt: response.verified_at,
        });
      }

      localStorage.setItem("user_status", "VERIFIED_COMPLETE");

      setIsLoading(false);
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
      navigate("/user/dashboard");
    } catch (err: unknown) {
      setIsLoading(false);
      const errMsg =
        err instanceof Error
          ? err.message
          : t("auth.registerDetails.errors.generic");
      setErrors({
        api: errMsg,
      });
    }
  };

  return (
    <main className="flex-1 w-full text-content-primary flex justify-center items-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-150">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 transition-all duration-150">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/20">
            <User className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-content-primary">
            {t("auth.registerDetails.title")}
          </h2>
          <p className="text-sm text-content-secondary">
            {t("auth.registerDetails.subtitle")}
            {defaultEmail && ` (${defaultEmail})`}
          </p>
        </div>

        {/* Global/API Error Alert */}
        {errors.api && (
          <div
            className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-sm"
            role="alert"
            data-testid="api-error-alert"
          >
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errors.api}</span>
          </div>
        )}

        {/* Registration Form */}
        <form
          role="form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          {/* Full Name Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="fullName"
              className="text-xs font-semibold text-content-secondary tracking-wide"
            >
              {t("auth.registerDetails.fields.fullName")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
                <User className="h-4 w-4" />
              </span>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t(
                  "auth.registerDetails.fields.fullNamePlaceholder",
                )}
                className={`w-full pl-10 pr-4 py-2.5 min-h-[48px] bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.fullName
                    ? "border-rose-500 focus:ring-rose-500/25 focus:border-rose-500"
                    : "border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive"
                }`}
                aria-invalid={errors.fullName ? "true" : "false"}
                aria-describedby={
                  errors.fullName ? "fullName-error" : undefined
                }
                disabled={isLoading}
                required
              />
            </div>
            {errors.fullName && (
              <span
                id="fullName-error"
                className="text-xs text-rose-400 mt-0.5"
                role="alert"
              >
                {errors.fullName}
              </span>
            )}
          </div>

          {/* Location Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="location"
              className="text-xs font-semibold text-content-secondary tracking-wide"
            >
              {t("auth.registerDetails.fields.location")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
                <MapPin className="h-4 w-4" />
              </span>
              <input
                id="location"
                type="text"
                value={locationVal}
                onChange={(e) => setLocationVal(e.target.value)}
                placeholder={t(
                  "auth.registerDetails.fields.locationPlaceholder",
                )}
                className={`w-full pl-10 pr-4 py-2.5 min-h-[48px] bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.location
                    ? "border-rose-500 focus:ring-rose-500/25 focus:border-rose-500"
                    : "border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive"
                }`}
                aria-invalid={errors.location ? "true" : "false"}
                aria-describedby={
                  errors.location ? "location-error" : undefined
                }
                disabled={isLoading}
                required
              />
            </div>
            {errors.location && (
              <span
                id="location-error"
                className="text-xs text-rose-400 mt-0.5"
                role="alert"
              >
                {errors.location}
              </span>
            )}
          </div>

          {/* Phone Number Input */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="phone"
              className="text-xs font-semibold text-content-secondary tracking-wide"
            >
              {t("auth.registerDetails.fields.phone")}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
                <Phone className="h-4 w-4" />
              </span>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("auth.registerDetails.fields.phonePlaceholder")}
                className="w-full pl-10 pr-4 py-2.5 min-h-[48px] bg-surface-elevated border border-border-subtle rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 focus:ring-border-interactive/25 focus:border-border-interactive transition-all duration-150"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 min-h-[48px] bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2
                className="h-5 w-5 animate-spin"
                data-testid="submit-spinner"
              />
            ) : (
              t("auth.registerDetails.submit")
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

export default RegistrationDetailsView;
