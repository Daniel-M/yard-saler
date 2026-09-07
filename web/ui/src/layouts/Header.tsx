import { LanguageToggle } from "@components/LanguageToggle";
import { ThemeToggle } from "@components/ThemeToggle";
import { useAuth } from "@context/AuthContext";
import type { UserProfile } from "@context/AuthContext";
import { Bell, Download, Layers, LogOut, Menu, X } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ConnectionStatus } from "@components/layout/ConnectionStatus";
import { useNotifications } from "@hooks/useNotifications";
import { useNavigate } from "react-router";
import { CoffeeButton } from "@features/header/components/CoffeeButton";
import { ContactButton } from "@features/header/components/ContactButton";


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
  hideThemeLanguageToggles?: boolean;
  onNotificationClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  installPrompt = null,
  onInstall,
  activeTab = "home",
  onTabChange,
  onLogout,
  onHamburgerClick,
  showHamburger = false,
  hideNavLinks = false,
  hideThemeLanguageToggles = false,
  onNotificationClick,
}) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { isVerified } = user || { isVerified: false };
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleNotificationItemClick = (n: any) => {
    if (!n.is_read) {
      markAsRead(n.id);
    }
    setIsDropdownOpen(false);
    if (
      n.type === "message" ||
      n.type === "chat" ||
      n.type === "new_message" ||
      n.title?.toLowerCase().includes("message") ||
      n.content?.toLowerCase().includes("message")
    ) {
      navigate(`/messages?thread_id=${n.reference_id}`);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isDropdownOpen]);

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
              className="flex lg:hidden min-h-[48px] min-w-[48px] items-center justify-center text-content-secondary hover:text-content-primary hover:bg-surface-elevated rounded-lg bg-surface border border-border-subtle transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue shadow-md cursor-pointer mr-1"
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
          <ConnectionStatus />

          {installPrompt && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-hover text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> {t("header.installApp")}
            </button>
          )}
          {!hideThemeLanguageToggles && (
            <>
              <LanguageToggle />
              <ThemeToggle />
            </>
          )}

          {/* User Profile dropdown wrapper replaced with notification bell */}
          {user && (
            <div className="flex items-center gap-3 border-l border-border-subtle pl-3">
              {/* Buy Me a Coffee */}
              <CoffeeButton />
              {/* Contact Developer */}
              <ContactButton />

              <div className="relative" ref={dropdownRef}>

                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
                  aria-label={t("dashboard.drawer.notificationsAriaLabel", "Notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center border border-[var(--surface)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 py-2">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
                      <span className="font-bold text-sm text-[var(--content-primary)]">
                        {t("notifications.title", "Notifications")}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          {t("notifications.markAllRead", "Mark all as read")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-[var(--content-secondary)]">
                          {t("notifications.empty", "No notifications")}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationItemClick(n)}
                            className={`px-4 py-3 text-left hover:bg-[var(--surface-elevated)] transition-colors duration-150 cursor-pointer flex gap-2 ${
                              !n.is_read ? "bg-cyan-600/5 font-medium" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--content-primary)] truncate">{n.title}</p>
                              <p className="text-xs text-[var(--content-secondary)] mt-0.5 line-clamp-2">{n.content}</p>
                              <span className="text-[9px] text-[var(--content-secondary)] block mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
          <ConnectionStatus />

          {installPrompt && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1 bg-accent-blue hover:bg-accent-blue-hover text-black p-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              aria-label={t("header.installApp")}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}

          {!hideThemeLanguageToggles && (
            <>
              <LanguageToggle />
              <ThemeToggle />
            </>
          )}

          {/* User Profile and logout on mobile if user exists - Replaced Profile button with Notification Bell */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Buy Me a Coffee */}
              <CoffeeButton />
              {/* Contact Developer */}
              <ContactButton />
              <div className="relative" ref={mobileDropdownRef}>

                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="relative p-1.5 text-content-secondary hover:text-content-primary rounded-lg hover:bg-surface-elevated transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue cursor-pointer"
                  aria-label={t("dashboard.drawer.notificationsAriaLabel", "Notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center border border-[var(--surface)]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl shadow-xl z-50 py-2">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
                      <span className="font-bold text-sm text-[var(--content-primary)]">
                        {t("notifications.title", "Notifications")}
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                        >
                          {t("notifications.markAllRead", "Mark all as read")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-[var(--content-secondary)]">
                          {t("notifications.empty", "No notifications")}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationItemClick(n)}
                            className={`px-4 py-3 text-left hover:bg-[var(--surface-elevated)] transition-colors duration-150 cursor-pointer flex gap-2 ${
                              !n.is_read ? "bg-cyan-600/5 font-medium" : ""
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-[var(--content-primary)] truncate">{n.title}</p>
                              <p className="text-xs text-[var(--content-secondary)] mt-0.5 line-clamp-2">{n.content}</p>
                              <span className="text-[9px] text-[var(--content-secondary)] block mt-1">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {!n.is_read && <span className="h-2 w-2 rounded-full bg-cyan-500 mt-1.5 shrink-0" />}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
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
