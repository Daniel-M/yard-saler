import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import LandingPage from './LandingPage';
import { AuthContext } from '../context/AuthContext';

import { ThemeProvider } from '../context/ThemeContext';

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
    expect(screen.getByText('Welcome to Whale Shark')).toBeInTheDocument();
    
    // CTAs
    const ctaPrimary = screen.getByRole('button', { name: 'Start for free' });
    expect(ctaPrimary).toBeInTheDocument();
    expect(ctaPrimary.getAttribute('href')).toBe('/login');

    const ctaSecondary = screen.getByRole('button', { name: 'Learn more' });
    expect(ctaSecondary).toBeInTheDocument();
    expect(ctaSecondary.getAttribute('href')).toBe('/about');

    // Features
    expect(screen.getByText('Lightning fast performance')).toBeInTheDocument();
    expect(screen.getByText('Bank-grade security')).toBeInTheDocument();
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
    expect(screen.queryByText('Welcome to Whale Shark')).not.toBeInTheDocument();
  });
});
