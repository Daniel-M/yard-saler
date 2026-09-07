import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerifyPage from './VerifyPage';
import { useVerificationGuard } from "@hooks/useVerificationGuard";

vi.mock("@hooks/useVerificationGuard", () => ({
  useVerificationGuard: vi.fn(),
}));

vi.mock('../views/VerifyView', () => ({
  VerifyView: ({ onVerificationSuccess }: any) => (
    <div data-testid="mock-verify-view">
      <button onClick={() => onVerificationSuccess('MOCK_TOKEN', { profile_complete: true })}>
        Success Dashboard
      </button>
      <button onClick={() => onVerificationSuccess('MOCK_TOKEN', { profile_complete: false })}>
        Success Register
      </button>
    </div>
  ),
}));

const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('VerifyPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('shows loading spinner when checking', () => {
    vi.mocked(useVerificationGuard).mockReturnValue({
      checking: true,
      isProfileLoading: false,
    });

    render(<VerifyPage />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('shows loading spinner when profile is loading', () => {
    vi.mocked(useVerificationGuard).mockReturnValue({
      checking: false,
      isProfileLoading: true,
    });

    render(<VerifyPage />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
  });

  it('renders VerifyView when not loading and checking completes', () => {
    vi.mocked(useVerificationGuard).mockReturnValue({
      checking: false,
      isProfileLoading: false,
    });

    render(<VerifyPage />);

    expect(screen.getByTestId('mock-verify-view')).toBeInTheDocument();
  });

  it('redirects to dashboard after 1500ms on verification success with completed profile', () => {
    vi.mocked(useVerificationGuard).mockReturnValue({
      checking: false,
      isProfileLoading: false,
    });

    render(<VerifyPage />);

    const btn = screen.getByText('Success Dashboard');
    btn.click();

    vi.advanceTimersByTime(1500);

    expect(mockNavigate).toHaveBeenCalledWith('/user/dashboard', { replace: true });
  });

  it('redirects to register after 1500ms on verification success with incomplete profile', () => {
    vi.mocked(useVerificationGuard).mockReturnValue({
      checking: false,
      isProfileLoading: false,
    });

    render(<VerifyPage />);

    const btn = screen.getByText('Success Register');
    btn.click();

    vi.advanceTimersByTime(1500);

    expect(mockNavigate).toHaveBeenCalledWith('/user/register', { replace: true });
  });
});
