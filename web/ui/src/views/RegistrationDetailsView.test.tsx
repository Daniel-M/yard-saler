import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegistrationDetailsView from './RegistrationDetailsView';
import { useUserApi } from '../hooks/useUserApi';

const mockEditDetails = vi.fn();
vi.mock('../hooks/useUserApi', () => ({
  useUserApi: vi.fn(() => ({
    editDetails: mockEditDetails,
  })),
}));

// Setup mocks for react-router-dom
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const keys: Record<string, string> = {
        'auth.registerDetails.title': 'Complete Registration',
        'auth.registerDetails.subtitle': 'Tell us a bit more about yourself to get started',
        'auth.registerDetails.fields.fullName': 'Full Name',
        'auth.registerDetails.fields.fullNamePlaceholder': 'John Doe',
        'auth.registerDetails.fields.location': 'Location (City, Zip Code)',
        'auth.registerDetails.fields.locationPlaceholder': 'e.g., Seattle, WA 98101',
        'auth.registerDetails.fields.phone': 'Phone Number (Optional)',
        'auth.registerDetails.fields.phonePlaceholder': '(555) 000-0000',
        'auth.registerDetails.submit': 'Complete Registration',
        'auth.registerDetails.errors.fullNameRequired': 'Full Name is required.',
        'auth.registerDetails.errors.locationRequired': 'Location is required.',
        'auth.registerDetails.errors.generic': 'Something went wrong. Please check details and try again.',
      };
      return keys[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() }
  })
}));

describe('RegistrationDetailsView Component', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockImplementation((key) => {
        if (key === 'paseto_token' || key === 'token') {
          return 'MOCK_ACCESS_TOKEN';
        }
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    });
    mockNavigate.mockClear();
    mockEditDetails.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('redirects to login if there is no token', () => {
    vi.mocked(localStorage.getItem).mockReturnValue(null);
    render(<RegistrationDetailsView />);
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });

  it('redirects to dashboard if user status is VERIFIED_COMPLETE', () => {
    vi.mocked(localStorage.getItem).mockImplementation((key) => {
      if (key === 'user_status') return 'VERIFIED_COMPLETE';
      return 'MOCK_ACCESS_TOKEN';
    });
    render(<RegistrationDetailsView />);
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
  });

  it('renders all form elements, labels, and placeholders correctly', () => {
    render(<RegistrationDetailsView />);

    expect(screen.getByRole('heading', { name: 'Complete Registration' })).toBeInTheDocument();
    expect(screen.getByText('Tell us a bit more about yourself to get started')).toBeInTheDocument();

    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();

    expect(screen.getByLabelText('Location (City, Zip Code)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g., Seattle, WA 98101')).toBeInTheDocument();

    expect(screen.getByLabelText('Phone Number (Optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('(555) 000-0000')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'Complete Registration' })).toBeInTheDocument();
  });

  it('displays default email in the subtitle if provided', () => {
    render(<RegistrationDetailsView defaultEmail="user@example.com" />);
    expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<RegistrationDetailsView />);

    const submitBtn = screen.getByRole('button', { name: 'Complete Registration' });
    await user.click(submitBtn);

    expect(screen.getByText('Full Name is required.')).toBeInTheDocument();
    expect(screen.getByText('Location is required.')).toBeInTheDocument();
    expect(mockEditDetails).not.toHaveBeenCalled();
  });

  it('submits form successfully and calls callbacks on successful response', async () => {
    const user = userEvent.setup();
    const onCompleteMock = vi.fn();

    mockEditDetails.mockResolvedValueOnce({ success: true });

    render(<RegistrationDetailsView onRegistrationComplete={onCompleteMock} />);

    await user.type(screen.getByLabelText('Full Name'), 'Alice Smith');
    await user.type(screen.getByLabelText('Location (City, Zip Code)'), 'San Francisco, CA 94105');
    await user.type(screen.getByLabelText('Phone Number (Optional)'), '5551234567');

    const submitBtn = screen.getByRole('button', { name: 'Complete Registration' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockEditDetails).toHaveBeenCalledWith({
        firstName: 'Alice',
        lastName: 'Smith',
        mobilePhone: '5551234567',
        socials: ['San Francisco, CA 94105'],
      });
    });

    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('user_status', 'VERIFIED_COMPLETE');
      expect(onCompleteMock).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows API error message if API registration fails', async () => {
    const user = userEvent.setup();

    mockEditDetails.mockRejectedValueOnce(new Error('API failure'));

    render(<RegistrationDetailsView />);

    await user.type(screen.getByLabelText('Full Name'), 'Alice Smith');
    await user.type(screen.getByLabelText('Location (City, Zip Code)'), 'San Francisco, CA 94105');

    const submitBtn = screen.getByRole('button', { name: 'Complete Registration' });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('api-error-alert')).toBeInTheDocument();
      expect(screen.getByText('API failure')).toBeInTheDocument();
    });
  });
});
