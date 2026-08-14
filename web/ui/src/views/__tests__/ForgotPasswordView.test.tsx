import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordView from '../ForgotPasswordView';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const keys: Record<string, string> = {
        'recovery.title': 'Recuperar contraseña',
        'recovery.subtitle': 'Ingresa tu correo electrónico para recibir un enlace de restablecimiento',
        'recovery.fields.email': 'Correo electrónico',
        'recovery.fields.emailPlaceholder': 'correo@ejemplo.com',
        'recovery.buttons.submit': 'Enviar enlace',
        'recovery.buttons.backToLogin': 'Volver a iniciar sesión',
        'recovery.success.title': 'Enlace enviado',
        'recovery.success.message': 'Si tu correo está registrado en nuestro sistema, recibirás un enlace para restablecer tu contraseña en unos momentos.',
        'recovery.errors.emailRequired': 'El correo electrónico es requerido.',
        'recovery.errors.invalidEmail': 'Por favor, ingresa un correo electrónico válido.'
      };
      return keys[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() }
  })
}));

describe('ForgotPasswordView Component', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('renders all form controls and fields correctly', () => {
    render(<ForgotPasswordView onBackToLogin={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /recuperar contraseña/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/correo@ejemplo.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /volver a iniciar sesión/i })).toBeInTheDocument();
  });

  it('navigates back to login when back button is clicked', async () => {
    const onBackToLoginMock = vi.fn();
    const user = userEvent.setup();
    render(<ForgotPasswordView onBackToLogin={onBackToLoginMock} />);

    const backBtn = screen.getByRole('button', { name: /volver a iniciar sesión/i });
    await user.click(backBtn);

    expect(onBackToLoginMock).toHaveBeenCalledTimes(1);
  });

  it('shows error if email field is empty and submitted', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordView onBackToLogin={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /enviar enlace/i });
    await user.click(submitBtn);

    expect(screen.getByText(/el correo electrónico es requerido/i)).toBeInTheDocument();
  });

  it('shows error if email format is invalid', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordView onBackToLogin={vi.fn()} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'invalid-email');

    const submitBtn = screen.getByRole('button', { name: /enviar enlace/i });
    await user.click(submitBtn);

    expect(screen.getByText(/por favor, ingresa un correo electrónico válido/i)).toBeInTheDocument();
  });

  it('transitions to success state on successful recovery request', async () => {
    const user = userEvent.setup();
    const onRecoveryInitiatedMock = vi.fn();
    
    // Mock successful fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'success', message: 'Recovery instructions sent if email exists' }),
    } as Response);

    render(
      <ForgotPasswordView 
        onBackToLogin={vi.fn()} 
        onRecoveryInitiated={onRecoveryInitiatedMock} 
      />
    );

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'user@example.com');

    const submitBtn = screen.getByRole('button', { name: /enviar enlace/i });
    await user.click(submitBtn);

    // Wait for the success state view
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /enlace enviado/i })).toBeInTheDocument();
      expect(screen.getByText(/si tu correo está registrado/i)).toBeInTheDocument();
    });

    expect(fetch).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    });

    expect(onRecoveryInitiatedMock).toHaveBeenCalledWith('user@example.com');
  });

  it('shows error if API request fails', async () => {
    const user = userEvent.setup();
    
    // Mock failed fetch
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    render(<ForgotPasswordView onBackToLogin={vi.fn()} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    await user.type(emailInput, 'user@example.com');

    const submitBtn = screen.getByRole('button', { name: /enviar enlace/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/por favor, ingresa un correo electrónico válido/i)).toBeInTheDocument();
    });
  });
});
