import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from "react-router";
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import LandingPage from './LandingPage';
import { AuthContext } from '../../context/AuthContext';

import { ThemeProvider } from '../../context/ThemeContext';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
    i18n: {
      language: 'en',
      changeLanguage: () => Promise.resolve(),
    },
  }),
  I18nextProvider: ({ children }: any) => children,
  initReactI18next: {
    type: '3rdParty',
    init: () => {},
  },
}));

vi.mock('@components/layout/ConnectionStatus', () => ({
  ConnectionStatus: () => null,
  default: () => null,
}));

describe('LandingPage', () => {
  beforeEach(() => {
    i18n.changeLanguage('en');
  });

  it('renders hero landing page when unauthenticated', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <ThemeProvider>
            <AuthContext.Provider value={{ token: null, setToken: vi.fn() }}>
              <LandingPage />
            </AuthContext.Provider>
          </ThemeProvider>
        </MemoryRouter>
      </I18nextProvider>
    );

    // Hero content
    expect(screen.getByText('landing.hero.title')).toBeInTheDocument();
    
    // CTAs
    const ctaPrimary = screen.getByRole('button', { name: 'landing.hero.ctaPrimary' });
    expect(ctaPrimary).toBeInTheDocument();
    expect(ctaPrimary.getAttribute('href')).toBe('/login');

    const ctaSecondary = screen.getByRole('button', { name: 'landing.hero.ctaSecondary' });
    expect(ctaSecondary).toBeInTheDocument();
    expect(ctaSecondary.getAttribute('href')).toBe('/about');

    // Features
    expect(screen.getByText('landing.features.speed.title')).toBeInTheDocument();
    expect(screen.getByText('landing.features.security.title')).toBeInTheDocument();
  });

  it('redirects to /dashboard when authenticated', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/']}>
          <ThemeProvider>
            <AuthContext.Provider value={{ token: 'fake-token', setToken: vi.fn() }}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
              </Routes>
            </AuthContext.Provider>
          </ThemeProvider>
        </MemoryRouter>
      </I18nextProvider>
    );

    expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    expect(screen.queryByText('landing.hero.title')).not.toBeInTheDocument();
  });
});
