import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../Header';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const translations: Record<string, string> = {
        'header.title': 'Whale Shark',
        'header.statusOnline': 'Online',
        'header.statusOffline': 'Offline Mode',
        'header.installApp': 'Install App',
        'header.nav.home': 'Home',
        'header.nav.listings': 'Listings',
        'header.nav.about': 'About',
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

describe('Header Component', () => {
  it('renders application brand title', () => {
    render(<Header />);
    expect(screen.getByText('Whale Shark')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    render(<Header />);
    const desktopNav = screen.getByRole('navigation', { name: /desktop navigation/i });
    expect(desktopNav).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Listings' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'About' })).toBeInTheDocument();
  });

  it('renders online status when isOnline is true', () => {
    render(<Header isOnline={true} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('renders offline status when isOnline is false', () => {
    render(<Header isOnline={false} />);
    expect(screen.getByText('Offline Mode')).toBeInTheDocument();
  });

  it('handles navigation clicks correctly', () => {
    const handleTabChange = vi.fn();
    render(<Header onTabChange={handleTabChange} />);
    
    const listingsButton = screen.getByRole('button', { name: 'Listings' });
    fireEvent.click(listingsButton);
    expect(handleTabChange).toHaveBeenCalledWith('listings');
  });

  it('renders and triggers install button when installPrompt is provided', () => {
    const handleInstall = vi.fn();
    const mockPrompt = {};
    render(
      <Header installPrompt={mockPrompt} onInstall={handleInstall} />
    );

    const installButtons = screen.getAllByRole('button', { name: 'Install App' });
    expect(installButtons.length).toBeGreaterThan(0);
    fireEvent.click(installButtons[0]);
    expect(handleInstall).toHaveBeenCalled();
  });

  it('toggles mobile menu when menu button is clicked', () => {
    render(<Header />);
    
    // Header should not display mobile navigation items initially
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument();

    const toggleButton = screen.getByRole('button', { name: /toggle menu/i });
    fireEvent.click(toggleButton);

    const mobileNav = screen.getByRole('navigation', { name: /mobile navigation/i });
    expect(mobileNav).toBeInTheDocument();
  });
});
