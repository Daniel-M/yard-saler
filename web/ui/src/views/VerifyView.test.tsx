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

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, vi.fn()],
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
    mockNavigate.mockClear();
    vi.spyOn(window, 'setTimeout');
  });

  afterEach(() => {
    vi.clearAllMocks();
    mockVerify.mockClear();
    mockSearchParams = new URLSearchParams();
  });

  it('renders loading state immediately when verification code is present', async () => {
    mockSearchParams = new URLSearchParams('code=TEST_CODE');
    mockVerify.mockReturnValueOnce(new Promise(() => {}));

    render(<VerifyView />);

    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
    expect(screen.getByText('Verifying Email Address')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we confirm your email...')).toBeInTheDocument();
  });

  it('renders error state immediately if verification code is missing', async () => {
    mockSearchParams = new URLSearchParams('');
    const onVerificationErrorMock = vi.fn();

    render(<VerifyView onVerificationError={onVerificationErrorMock} />);

    expect(screen.getByTestId('error-state')).toBeInTheDocument();
    expect(screen.getByText('Verification Failed')).toBeInTheDocument();
    expect(screen.getByText('No verification code was provided in the URL.')).toBeInTheDocument();
    expect(onVerificationErrorMock).toHaveBeenCalledWith('No verification code was provided in the URL.');
  });

  it('handles successful verification, executes callbacks, and redirects', async () => {
    mockSearchParams = new URLSearchParams('code=VALID_CODE');
    const onVerificationSuccessMock = vi.fn();
    
    mockVerify.mockResolvedValueOnce({ status: 'success', token: 'MOCK_TOKEN' });

    render(<VerifyView onVerificationSuccess={onVerificationSuccessMock} />);

    // Success state should be rendered
    await waitFor(() => {
      expect(screen.getByTestId('success-state')).toBeInTheDocument();
      expect(screen.getByText('Email verified successfully! Redirecting...')).toBeInTheDocument();
    });

    expect(mockVerify).toHaveBeenCalledWith({ verificationCode: 'VALID_CODE' });

    expect(onVerificationSuccessMock).toHaveBeenCalledWith('MOCK_TOKEN');

    // Verify setTimeout was called and trigger the callback manually to check redirect
    expect(window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 1500);
    const verifyCall = vi.mocked(window.setTimeout).mock.calls.find(c => c[1] === 1500);
    expect(verifyCall).toBeDefined();
    const callback = verifyCall![0] as Function;
    callback();

    expect(mockNavigate).toHaveBeenCalledWith('/register-details');
  });

  it('handles verification failure and shows error state', async () => {
    mockSearchParams = new URLSearchParams('code=INVALID_CODE');
    const onVerificationErrorMock = vi.fn();
    
    mockVerify.mockRejectedValueOnce(new Error('The verification code is invalid or has expired.'));

    render(<VerifyView onVerificationError={onVerificationErrorMock} />);

    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
      expect(screen.getByText('The verification code is invalid or has expired.')).toBeInTheDocument();
    });

    expect(onVerificationErrorMock).toHaveBeenCalledWith('The verification code is invalid or has expired.');
  });

  it('allows retrying verification on failure', async () => {
    mockSearchParams = new URLSearchParams('code=RETRY_CODE');
    const user = userEvent.setup();
    
    mockVerify
      .mockRejectedValueOnce(new Error('The verification code is invalid or has expired.'))
      .mockResolvedValueOnce({ status: 'success', token: 'RETRY_TOKEN' });

    render(<VerifyView />);

    // Check failed state first
    await waitFor(() => {
      expect(screen.getByTestId('error-state')).toBeInTheDocument();
    });

    // Click retry button
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    await user.click(retryBtn);

    // Should render success state now
    await waitFor(() => {
      expect(screen.getByTestId('success-state')).toBeInTheDocument();
    });

    expect(mockVerify).toHaveBeenCalledTimes(2);
  });

  it('navigates back to login when back to login button is clicked', async () => {
    mockSearchParams = new URLSearchParams('');
    const user = userEvent.setup();

    render(<VerifyView />);

    const backBtn = screen.getByRole('button', { name: /back to login/i });
    await user.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
