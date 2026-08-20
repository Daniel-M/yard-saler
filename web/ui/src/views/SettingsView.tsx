import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@context/AuthContext";
import { useUserProfile } from "@features/auth/hooks/useUserProfile";
import { apiClient } from "@services/api/client";

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { fetchProfile } = useUserProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [socials, setSocials] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setMobilePhone(user.mobilePhone || "");
      setSocials(Array.isArray(user.socials) ? user.socials.join(", ") : (user.socials || ""));
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const payload: Record<string, any> = {
        first_name: firstName,
        last_name: lastName,
        mobile_phone: mobilePhone,
        socials: socials,
      };
      if (password) {
        payload.password = password;
      }

      await apiClient("/api/users/me", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setSaveSuccess(true);
      setPassword("");
      await fetchProfile();
    } catch (err: any) {
      setError(err?.message || "Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-6">
        <h2 className="text-2xl font-bold text-slate-50 mb-6">
          {t("yard_sale.settings.title")}
        </h2>

        {saveSuccess && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
            {t("yard_sale.settings.success")}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t("yard_sale.settings.email")}
            </label>
            <input
              type="email"
              value={user?.email || ""}
              disabled
              className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded p-2.5 cursor-not-allowed focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t("yard_sale.settings.firstName")}
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded p-2.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t("yard_sale.settings.lastName")}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded p-2.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t("yard_sale.settings.mobilePhone")}
            </label>
            <input
              type="text"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded p-2.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t("yard_sale.settings.socials")}
            </label>
            <input
              type="text"
              value={socials}
              onChange={(e) => setSocials(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded p-2.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t("yard_sale.settings.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded p-2.5 focus-visible:ring-2 focus-visible:ring-cyan-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full min-h-[48px] bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-slate-950 font-semibold rounded transition-colors duration-150 flex items-center justify-center cursor-pointer"
          >
            {isSaving ? "Saving..." : t("yard_sale.settings.save")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsView;
