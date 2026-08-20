import React from 'react';
import { useTranslation } from 'react-i18next';

export const Footer: React.FC = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border-subtle bg-canvas px-4 py-6 sm:px-6 transition-colors duration-150">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-content-muted">
        <p>{t('footer.copyright', { year: currentYear })}</p>
        <div className="flex items-center gap-4">
          <a href="/terms" className="hover:text-content-primary transition-colors">
            {t('footer.links.terms')}
          </a>
          <span>•</span>
          <a href="/privacy" className="hover:text-content-primary transition-colors">
            {t('footer.links.privacy')}
          </a>
          <span>•</span>
          <a href="/contact" className="hover:text-content-primary transition-colors">
            {t('footer.links.contact')}
          </a>
        </div>
      </div>
    </footer>
  );
};
