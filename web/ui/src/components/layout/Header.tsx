import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, Wifi, WifiOff, Download, Menu, X } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { LanguageToggle } from '../LanguageToggle';

interface HeaderProps {
  isOnline?: boolean;
  installPrompt?: any;
  onInstall?: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  isOnline = true,
  installPrompt = null,
  onInstall,
  activeTab = 'home',
  onTabChange,
}) => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs = [
    { id: 'home', label: t('header.nav.home') },
    { id: 'listings', label: t('header.nav.listings') },
    { id: 'about', label: t('header.nav.about') },
  ];

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-canvas/80 border-b border-border-subtle px-4 py-3 sm:px-6 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-content-primary flex items-center gap-2">
              {t('header.title')}{' '}
              <span className="text-xs font-normal text-accent-blue bg-accent-blue/10 px-2 py-0.5 rounded-full">
                v1.0
              </span>
            </h1>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Desktop navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`text-sm font-medium transition-colors hover:text-content-primary cursor-pointer ${
                activeTab === tab.id ? 'text-accent-blue' : 'text-content-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Status Indicators & Installation */}
        <div className="hidden md:flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" /> {t('header.statusOnline')}
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" /> {t('header.statusOffline')}
              </>
            )}
          </span>

          {installPrompt && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1.5 bg-accent-blue hover:bg-accent-blue-hover text-black px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> {t('header.installApp')}
            </button>
          )}
          <LanguageToggle />
          <ThemeToggle />
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          </span>

          {installPrompt && onInstall && (
            <button
              onClick={onInstall}
              className="inline-flex items-center gap-1 bg-accent-blue hover:bg-accent-blue-hover text-black p-1.5 rounded-lg text-xs font-semibold cursor-pointer"
              aria-label={t('header.installApp')}
            >
              <Download className="h-3.5 w-3.5" />
            </button>
          )}

          <LanguageToggle />
          <ThemeToggle />

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-content-secondary hover:text-content-primary rounded-lg border border-border-subtle bg-surface-elevated/50 cursor-pointer"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-border-subtle flex flex-col gap-2">
          <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-surface cursor-pointer ${
                  activeTab === tab.id ? 'bg-accent-blue/10 text-accent-blue' : 'text-content-secondary'
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
