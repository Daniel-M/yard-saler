import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string, options?: any) => {
      const translations: Record<string, string> = {
        'footer.copyright': `© ${options?.year || ''} Whale Shark. All rights reserved.`,
        'footer.links.terms': 'Terms of Service',
        'footer.links.privacy': 'Privacy Policy',
        'footer.links.contact': 'Contact Us',
      };
      return translations[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() },
  }),
}));

describe('Footer Component', () => {
  it('renders copyright text with the current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(`© ${currentYear} Whale Shark. All rights reserved.`)).toBeInTheDocument();
  });

  it('renders localized links', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toBeInTheDocument();
  });
});
