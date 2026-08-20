import React from "react";
import { Outlet } from "react-router";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { UnverifiedBanner } from "./UnverifiedBanner";

interface LayoutProps {
  children?: React.ReactNode;
  isOnline?: boolean;
  installPrompt?: any;
  onInstall?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  isOnline,
  installPrompt,
  onInstall,
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans transition-colors duration-150">
      <UnverifiedBanner />
      <Header
        isOnline={isOnline}
        installPrompt={installPrompt}
        onInstall={onInstall}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:py-12 w-full flex flex-col">
        {children || <Outlet />}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
