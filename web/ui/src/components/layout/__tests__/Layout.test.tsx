import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from '../Layout';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const translations: Record<string, string> = {
        'header.title': 'Whale Shark',
        'header.statusOnline': 'Online',
        'header.statusOffline': 'Offline Mode',
        'footer.copyright': '© 2026 Whale Shark. All rights reserved.',
        'footer.links.terms': 'Terms of Service',
        'footer.links.privacy': 'Privacy Policy',
        'footer.links.contact': 'Contact Us',
      };
      return translations[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() },
  }),
}));

vi.mock('../../../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

describe('Layout Component', () => {
  it('renders children, header, and footer inside the Layout', () => {
    render(
      <Layout>
        <div data-testid="test-content">Main Page Content</div>
      </Layout>
    );

    // Assert children are rendered
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Main Page Content')).toBeInTheDocument();

    // Assert header is rendered
    expect(screen.getByText('Whale Shark')).toBeInTheDocument();

    // Assert footer is rendered
    expect(screen.getByText('© 2026 Whale Shark. All rights reserved.')).toBeInTheDocument();
  });
});
