import { useAuth } from "@context/AuthContext";
import { useDrawer } from "@context/DrawerContext";
import { Home, LogOut, Search, Settings, Tag, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router";

import { Header } from "./Header";
import { UnverifiedBanner } from "./UnverifiedBanner";

export interface NavigationItem {
  id: string;
  labelKey: string;
  path: string;
  icon: string;
}

interface DrawerLayoutProps {
  onLogout?: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Home,
  Tag,
  Search,
};

export const DrawerLayout: React.FC<DrawerLayoutProps> = ({ onLogout }) => {
  const { t } = useTranslation();
  const location = useLocation();

  const { user } = useAuth();

  const { isDrawerOpen, openDrawer, closeDrawer } = useDrawer();
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileSettingsTriggerRef = useRef<HTMLButtonElement>(null);
  const modalCloseRef = useRef<HTMLButtonElement>(null);

  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Dismiss toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Trap focus and handle escape key inside mobile drawer
  useEffect(() => {
    if (!isDrawerOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeDrawer();
        hamburgerRef.current?.focus();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = drawerRef.current?.querySelectorAll(
          'a, button, [tabindex="0"]',
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstEl = focusableElements[0] as HTMLElement;
        const lastEl = focusableElements[
          focusableElements.length - 1
        ] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Initial focus on open
    setTimeout(() => {
      const closeBtn = drawerRef.current?.querySelector("button[aria-label]");
      if (closeBtn) {
        (closeBtn as HTMLElement).focus();
      }
    }, 50);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  const navItems: NavigationItem[] = [
    {
      id: "home",
      labelKey: "dashboard.nav.home",
      path: "/dashboard",
      icon: "Home",
    },
    {
      id: "listings",
      labelKey: "dashboard.nav.myListings",
      path: "/dashboard/my-listings",
      icon: "Tag",
    },
    {
      id: "explore",
      labelKey: "dashboard.nav.explore",
      path: "/dashboard/explore",
      icon: "Search",
    },
  ];

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

  const handleProfileClick = () => {
    setToastMessage(t("dashboard.stubs.profileComingSoon"));
  };

  // Handle focus trapping and keyboard navigation in Settings Modal
  useEffect(() => {
    if (!isSettingsModalOpen) return;

    const handleModalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsSettingsModalOpen(false);
        // Return focus to the active trigger
        if (
          drawerRef.current &&
          drawerRef.current.contains(document.activeElement)
        ) {
          mobileSettingsTriggerRef.current?.focus();
        } else {
          settingsTriggerRef.current?.focus();
        }
        return;
      }
      if (e.key === "Tab") {
        // Modal only has one focusable element (Close button), so we trap focus on it
        e.preventDefault();
        modalCloseRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleModalKeyDown);

    // Focus the close button on open
    setTimeout(() => {
      modalCloseRef.current?.focus();
    }, 50);

    return () => window.removeEventListener("keydown", handleModalKeyDown);
  }, [isSettingsModalOpen]);

  return (
    <div className="min-h-screen bg-[var(--canvas)] text-[var(--content-primary)] flex flex-col font-sans">
      {/* State-driven local toast banner */}
      {toastMessage && (
        <div
          role="alert"
          className="fixed bottom-4 right-4 z-50 bg-cyan-950 border border-cyan-800 text-cyan-200 px-4 py-3 rounded-lg shadow-lg flex items-center transition-all duration-300"
        >
          {toastMessage}
        </div>
      )}

      <div className="flex flex-1 relative overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="hidden lg:flex lg:flex-col lg:w-16 lg:hover:w-64 lg:focus-within:w-64 bg-[var(--surface)] border-r border-[var(--border-subtle)] shrink-0 transition-all duration-300 ease-in-out group"
          aria-expanded={isDesktopExpanded}
          onMouseEnter={() => setIsDesktopExpanded(true)}
          onMouseLeave={() => setIsDesktopExpanded(false)}
          onFocus={() => setIsDesktopExpanded(true)}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDesktopExpanded(false);
            }
          }}
        >
          <div className="h-16 flex items-center justify-center lg:justify-start lg:px-5 border-b border-[var(--border-subtle)] overflow-hidden whitespace-nowrap">
            {/* Collapsed short logo */}
            <span className="font-bold text-lg text-cyan-400 tracking-wider lg:block lg:group-hover:hidden lg:group-focus-within:hidden">
              WS
            </span>
            {/* Expanded full logo */}
            <span className="font-bold text-lg text-cyan-400 tracking-wider hidden lg:group-hover:block lg:group-focus-within:block">
              WHALE SHARK
            </span>
          </div>

          <nav className="flex-1 px-4 lg:px-2 py-6 space-y-1">
            {navItems.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Home;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  aria-label={t(item.labelKey)}
                  className={`relative flex items-center h-10 px-3 rounded-lg text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive
                      ? "bg-[var(--surface-elevated)] text-cyan-400 font-medium"
                      : "text-[var(--content-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--content-secondary)]"
                  }`}
                >
                  <div className="flex items-center justify-center w-5 h-5 shrink-0 lg:absolute lg:left-3.5">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <span className="lg:pl-8 lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-focus-within:pointer-events-auto transition-opacity duration-300 whitespace-nowrap">
                    {t(item.labelKey)}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 lg:p-2 border-t border-[var(--border-subtle)] space-y-3 relative">
            <button
              ref={settingsTriggerRef}
              onClick={handleSettingsClick}
              className="relative flex w-full items-center h-10 px-3 rounded-lg text-sm text-[var(--content-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--content-secondary)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <div className="flex items-center justify-center w-5 h-5 shrink-0 lg:absolute lg:left-3.5">
                <Settings className="h-5 w-5" />
              </div>
              <span className="lg:pl-8 lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-focus-within:pointer-events-auto transition-opacity duration-300 whitespace-nowrap">
                {t("dashboard.nav.settings")}
              </span>
            </button>

            <div className="relative flex items-center justify-between h-12 px-2 rounded-lg bg-[var(--surface-elevated)]/50 lg:bg-transparent lg:group-hover:bg-[var(--surface-elevated)]/50 lg:group-focus-within:bg-[var(--surface-elevated)]/50 transition-colors duration-300">
              <button
                onClick={handleProfileClick}
                className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded text-left w-full h-full relative"
              >
                <div className="flex items-center justify-center w-8 h-8 shrink-0 lg:absolute lg:left-2">
                  {user?.avatarUrl ? (
                    <img
                      src={user?.avatarUrl}
                      alt={user?.displayName}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-semibold text-xs">
                      {user?.initials}
                    </div>
                  )}
                </div>
                <div className="pl-10 lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-focus-within:pointer-events-auto transition-opacity duration-300 overflow-hidden whitespace-nowrap">
                  <p className="text-sm font-medium text-[var(--content-secondary)] truncate max-w-[110px]">
                    {user?.displayName}
                  </p>
                  <p className="text-xs text-[var(--content-primary)]0 truncate max-w-[110px]">
                    {user?.email}
                  </p>
                </div>
              </button>

              <button
                onClick={onLogout}
                aria-label={t("dashboard.nav.logout")}
                className="text-[var(--content-secondary)] hover:text-red-400 p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 lg:absolute lg:right-2 lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto lg:group-focus-within:opacity-100 lg:group-focus-within:pointer-events-auto transition-opacity duration-300"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer Backdrop */}
        {isDrawerOpen && (
          <div
            data-testid="drawer-backdrop"
            className="fixed inset-0 z-40 lg:hidden bg-[var(--canvas)]/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeDrawer}
          />
        )}

        {/* Mobile Drawer Panel */}
        <div
          ref={drawerRef}
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={t("dashboard.drawer.ariaLabel")}
          className={`fixed inset-y-0 left-0 z-50 w-72 bg-[var(--surface)] border-r border-[var(--border-subtle)] flex flex-col lg:hidden transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-subtle)]">
            <span className="font-bold text-lg text-cyan-400 tracking-wider">
              WHALE SHARK
            </span>
            <button
              onClick={closeDrawer}
              aria-label={t("dashboard.drawer.closeAriaLabel")}
              className="text-[var(--content-secondary)] hover:text-[var(--content-secondary)] p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1">
            {navItems.map((item) => {
              const IconComp = ICON_MAP[item.icon] || Home;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={closeDrawer}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    isActive
                      ? "bg-[var(--surface-elevated)] text-cyan-400 font-medium"
                      : "text-[var(--content-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--content-secondary)]"
                  }`}
                >
                  <IconComp className="h-5 w-5" />
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-[var(--border-subtle)] space-y-3">
            <button
              ref={mobileSettingsTriggerRef}
              onClick={() => {
                closeDrawer();
                handleSettingsClick();
              }}
              className="flex w-full items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--content-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--content-secondary)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              <Settings className="h-5 w-5" />
              {t("dashboard.nav.settings")}
            </button>

            <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--surface-elevated)]/50">
              <button
                onClick={() => {
                  closeDrawer();
                  handleProfileClick();
                }}
                className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded text-left"
              >
                {user?.avatarUrl ? (
                  <img
                    src={user?.avatarUrl}
                    alt={user?.displayName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-cyan-900 text-cyan-300 flex items-center justify-center font-semibold text-xs">
                    {user?.initials}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-[var(--content-secondary)] truncate max-w-[120px]">
                    {user?.displayName}
                  </p>
                  <p className="text-xs text-[var(--content-primary)]0 truncate max-w-[120px]">
                    {user?.email}
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  closeDrawer();
                  onLogout();
                }}
                aria-label={t("dashboard.nav.logout")}
                className="text-[var(--content-secondary)] hover:text-red-400 p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div
          className="flex-1 flex flex-col min-w-0"
          aria-hidden={isDrawerOpen ? "true" : "false"}
        >
          <UnverifiedBanner />
          <Header
            isOnline={isOnline}
            onLogout={onLogout}
            showHamburger={true}
            onHamburgerClick={openDrawer}
            hideNavLinks={true}
          />

          {/* Sticky Offline Banner */}
          {!isOnline && (
            <div
              role="status"
              className="bg-amber-950 border-b border-amber-800 text-amber-200 px-4 py-2 text-center text-sm font-medium sticky top-0 z-30 flex items-center justify-center gap-2"
            >
              <span>{t("dashboard.offlineBanner")}</span>
            </div>
          )}

          {/* Main workspace */}
          <main
            role="main"
            className="flex-1 overflow-y-auto"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
              paddingLeft: "env(safe-area-inset-left, 0px)",
              paddingRight: "env(safe-area-inset-right, 0px)",
            }}
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Settings Modal (Coming Soon) */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--canvas)]/80 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          onClick={() => setIsSettingsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border-subtle)] rounded-xl p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              id="settings-modal-title"
              className="text-lg font-bold text-[var(--content-secondary)] mb-2"
            >
              {t("dashboard.nav.settings")}
            </h3>
            <p className="text-[var(--content-secondary)] text-sm mb-6">
              {t("dashboard.stubs.settingsComingSoon")}
            </p>
            <div className="flex justify-end">
              <button
                ref={modalCloseRef}
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-sm font-semibold rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrawerLayout;
