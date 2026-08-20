import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router";
import { Rocket } from 'lucide-react';

export function HeroSection() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-canvas">
      <div className="mb-6 flex justify-center">
        <Rocket className="w-16 h-16 text-accent-blue" />
      </div>
      <h1 className="text-4xl md:text-6xl font-bold text-content-primary mb-6 max-w-4xl tracking-tight">
        {t('landing.hero.title')}
      </h1>
      <p className="text-lg md:text-xl text-content-secondary mb-10 max-w-2xl">
        {t('landing.hero.subtitle')}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          to="/login"
          role="button"
          className="flex items-center justify-center min-h-[48px] min-w-[48px] px-8 py-3 bg-accent-blue hover:bg-accent-blue-hover text-surface rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent-blue focus-visible:outline-none"
        >
          {t('landing.hero.ctaPrimary')}
        </Link>
        <Link
          to="/about"
          role="button"
          className="flex items-center justify-center min-h-[48px] min-w-[48px] px-8 py-3 bg-surface-elevated hover:bg-surface text-content-primary rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-border-subtle focus-visible:outline-none"
        >
          {t('landing.hero.ctaSecondary')}
        </Link>
      </div>
    </div>
  );
}
