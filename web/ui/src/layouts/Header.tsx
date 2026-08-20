import { LanguageToggle } from "@components/LanguageToggle";
import { ThemeToggle } from "@components/ThemeToggle";
import { type UserProfile, useAuth } from "@context/AuthContext";
import { Download, Layers, LogOut, Menu, Wifi, WifiOff, X } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export interface HeaderProps {
  isOnline?: boolean;
  installPrompt?: any;
  onInstall?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  user?: UserProfile;
  onLogout?: () => void;
  onHamburgerClick?: () => void;
  showHamburger?: boolean;
  hideNavLinks?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline = true,
  installPrompt = null,
  onInstall,
  activeTab = "home",
  onTabChange,
  onLogout,
  onHamburgerClick,
  showHamburger = false,
  hideNavLinks = false,
}) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isVerified } = user || { isVerified: false };

  const tabs = [
    { id: "home", label: t("header.nav.home") },
    { id: "about", label: t("header.nav.about") },
  ];

  if (isVerified) {
    tabs.splice(2, 0, { id: "dashboard", label: t("header.nav.dashboard") });
    tabs.splice(2, 0, { id: "listings", label: t("header.nav.dashboard") });
  }

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-canvas/80 border-b border-border-subtle px-4 py-3 sm:px-6 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo & Hamburger */}
        <div className="flex items-center gap-3">
          {showHamburger && onHamburgerClick && (
            <button
              onClick={onHamburgerClick}
              aria-label={t("dashboard.drawer.openAriaLabel")}
              className="lg:hidden min-h-[48px] min-w-[48px] flex items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-elevated rounded-lg bg-surface border border-border-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue shadow-md cursor-pointer mr-1"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center shadow-lg">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-content-primary flex items-center gap-2">
              {t("header.title")}{" "}
              <span className="text-xs font-normal text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
                v1.0
              </span>
            </h1>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        {!hideNavLinks && (
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Desktop navigation"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`text-sm font-medium transition-colors hover:text-content-primary cursor-pointer ${
                  activeTab === tab.id
                    ? "text-accent-blue"
                    : "text-content-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}

        {/* Status Indicators & Installation */}
        <div className="hidden md:flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" /> {t("header.statusOnline")}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" /> {t("header.statusOffline")}
              </>
            )}
          </span>

          {installPrompt && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-hover text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> {t("header.installApp")}
            </button>
          )}
          <LanguageToggle />
          <ThemeToggle />

          {/* User Profile dropdown wrapper */}
          {user && (
            <div className="flex items-center gap-3 border-l border-border-subtle pl-3">
              <button
                onClick={() => alert(t("dashboard.stubs.profileComingSoon"))}
                className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue rounded text-left cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-surface-elevated text-content-primary flex items-center justify-center font-semibold text-xs border border-border-subtle">
                    {user.initials}
                  </div>
                )}
                <span className="hidden lg:inline text-sm font-medium text-content-primary truncate max-w-[100px]">
                  {user.displayName}
                </span>
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  aria-label={t("dashboard.nav.logout")}
                  className="text-content-secondary hover:text-rose-400 p-1.5 rounded-lg hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu controls */}
        <div className="flex items-center gap-2 md:hidden">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isOnline
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
            }`}
          >
            {isOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
          </span>

          {installPrompt && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1 bg-accent-blue hover:bg-accent-blue-hover text-black p-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              aria-label={t("header.installApp")}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}

          <LanguageToggle />
          <ThemeToggle />

          {/* User Profile and logout on mobile if user exists */}
          {user && (
            <>
              <button
                onClick={() => alert(t("dashboard.stubs.profileComingSoon"))}
                className="h-8 w-8 rounded-full bg-surface-elevated text-content-primary flex items-center justify-center font-semibold text-xs border border-border-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  user.initials
                )}
              </button>
              {onLogout && (
                <button
                  onClick={onLogout}
                  aria-label={t("dashboard.nav.logout")}
                  className="text-content-secondary hover:text-rose-400 p-1.5 rounded-lg hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              )}
            </>
          )}

          {!hideNavLinks && !showHamburger && (
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg border border-border-subtle bg-surface-elevated/50 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && !hideNavLinks && (
        <div className="md:hidden mt-3 pt-3 border-t border-border-subtle flex flex-col gap-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-accent-blue/10 text-accent-blue"
                    : "text-content-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
