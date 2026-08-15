import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnverifiedBanner } from '../UnverifiedBanner';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const keys: Record<string, string> = {
        'auth.unverifiedBanner.text': 'You are browsing in restricted mode. Verify your email to create listings and message sellers.',
        'auth.unverifiedBanner.link': 'Verify Email',
      };
      return keys[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() },
  }),
}));

describe('UnverifiedBanner Component', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    mockNavigate.mockClear();
  });

  it('renders nothing when user_status is not UNVERIFIED', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    const { container } = render(<UnverifiedBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('renders banner when user_status is UNVERIFIED', () => {
    vi.mocked(localStorage.getItem).mockReturnValue('UNVERIFIED');
    render(<UnverifiedBanner />);
    
    expect(screen.getByTestId('unverified-banner')).toBeInTheDocument();
    expect(screen.getByText(/You are browsing in restricted mode/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify Email' })).toBeInTheDocument();
  });

  it('navigates to /verify when verify link/button is clicked', async () => {
    vi.mocked(localStorage.getItem).mockReturnValue('UNVERIFIED');
    const user = userEvent.setup();
    render(<UnverifiedBanner />);

    const verifyBtn = screen.getByRole('button', { name: 'Verify Email' });
    await user.click(verifyBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/verify');
  });
});
