import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VerifyView from './VerifyView';
import { useUserApi } from '../hooks/useUserApi';

vi.mock('../hooks/useUserApi', () => ({
  useUserApi: vi.fn(() => ({
    verify: vi.fn(),
  })),
}));

// Setup mocks for react-router-dom
const mockNavigate = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockLocation: { state: any } = { state: null };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
    useLocation: () => mockLocation,
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const keys: Record<string, string> = {
        'auth.verify.title': 'Verifying Email Address',
        'auth.verify.loading': 'Please wait while we confirm your email...',
        'auth.verify.success': 'Email verified successfully! Redirecting...',
        'auth.verify.toastSent': 'Verification code sent! Please check your email.',
        'auth.verify.exploreAsGuest': 'Explore as Guest (Restricted)',
        'auth.verify.manual.label': 'Enter 6-Digit Code',
        'auth.verify.manual.submit': 'Verify Code',
        'auth.verify.error.title': 'Verification Failed',
        'auth.verify.error.missingCode': 'No verification code was provided in the URL.',
        'auth.verify.error.invalidCode': 'The verification code is invalid or has expired.',
        'auth.verify.error.retry': 'Try Again',
        'auth.verify.error.backToLogin': 'Back to Login',
      };
      return keys[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() }
  })
}));

describe('VerifyView Component', () => {
  const mockVerify = vi.fn();

  beforeEach(() => {
    vi.mocked(useUserApi).mockReturnValue({
      verify: mockVerify,
    } as any);
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    mockNavigate.mockClear();
    vi.spyOn(window, 'setTimeout');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    mockVerify.mockClear();
    mockSearchParams = new URLSearchParams();
    mockLocation = { state: null };
  });

  it('renders loading state immediately when verification code is present in URL', async () => {
    mockSearchParams = new URLSearchParams('code=TEST_CODE');
    mockVerify.mockReturnValueOnce(new Promise(() => {}));

    render(<VerifyView />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Verifying Email Address')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we confirm your email...')).toBeInTheDocument();
  });

  it('renders idle state with manual entry when verification code is missing', async () => {
    mockSearchParams = new URLSearchParams('');
    render(<VerifyView />);

    expect(screen.getByTestId('idle-state')).toBeInTheDocument();
    expect(screen.getByLabelText('Enter 6-Digit Code')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify Code' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore as Guest (Restricted)' })).toBeInTheDocument();
  });

  it('renders signup toast if location state contains fromSignUp', async () => {
    mockSearchParams = new URLSearchParams('');
    mockLocation = { state: { fromSignUp: true } };

    render(<VerifyView />);

    expect(screen.getByTestId('signup-toast')).toBeInTheDocument();
    expect(screen.getByText('Verification code sent! Please check your email.')).toBeInTheDocument();

    // Verify setTimeout was called to dismiss toast after 5000ms
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it('handles manual code submission successfully and redirects', async () => {
    mockSearchParams = new URLSearchParams('');
    const user = userEvent.setup();
    mockVerify.mockResolvedValueOnce({ status: 'success', token: 'MOCK_TOKEN' });

    render(<VerifyView />);

    const input = screen.getByLabelText('Enter 6-Digit Code');
    await user.type(input, '123456');

    const submitBtn = screen.getByRole('button', { name: 'Verify Code' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockVerify).toHaveBeenCalledWith({ verificationCode: '123456' });
      expect(screen.getByTestId('success-state')).toBeInTheDocument();
    });

    expect(localStorage.setItem).toHaveBeenCalledWith('user_status', 'VERIFIED_PENDING_DETAILS');
    expect(localStorage.setItem).toHaveBeenCalledWith('paseto_token', 'MOCK_TOKEN');

    // Callback simulation for redirect
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    const redirectCall = vi.mocked(window.setTimeout).mock.calls.find(c => c[1] === 1500);
    expect(redirectCall).toBeDefined();
    redirectCall![0]();

    expect(mockNavigate).toHaveBeenCalledWith('/register-details');
  });

  it('handles explore as guest skip option', async () => {
    mockSearchParams = new URLSearchParams('');
    const user = userEvent.setup();

    render(<VerifyView />);

    const guestBtn = screen.getByRole('button', { name: 'Explore as Guest (Restricted)' });
    await user.click(guestBtn);

    expect(localStorage.setItem).toHaveBeenCalledWith('user_status', 'UNVERIFIED');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('allows retrying verification on manual or URL code failure', async () => {
    mockSearchParams = new URLSearchParams('code=RETRY_CODE');
    const user = userEvent.setup();
    
    mockVerify
      .mockRejectedValueOnce(new Error('The verification code is invalid or has expired.'))
      .mockResolvedValueOnce({ status: 'success', token: 'RETRY_TOKEN' });

    render(<VerifyView />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByTestId('success-state')).toBeInTheDocument();
    });

    expect(mockVerify).toHaveBeenCalledTimes(2);
  });
});
