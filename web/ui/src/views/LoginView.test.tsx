import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginView from './LoginView';

// Mock react-i18next with Spanish translation keys
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const keys: Record<string, string> = {
        'auth.title': 'Bienvenido',
        'auth.subtitle': 'Ingresa tus credenciales para continuar',
        'auth.tabs.login': 'Iniciar Sesión',
        'auth.tabs.signup': 'Registrarse',
        'auth.fields.email': 'Correo electrónico',
        'auth.fields.emailPlaceholder': 'correo@ejemplo.com',
        'auth.fields.password': 'Contraseña',
        'auth.fields.passwordPlaceholder': '••••••••',
        'auth.fields.showPassword': 'Mostrar contraseña',
        'auth.fields.hidePassword': 'Ocultar contraseña',
        'auth.buttons.loginSubmit': 'Ingresar',
        'auth.buttons.signupSubmit': 'Crear Cuenta',
        'auth.buttons.googleOAuth': 'Continuar con Google',
        'auth.buttons.forgotPassword': '¿Olvidaste tu contraseña?',
        'auth.labels.divider': 'O continuar con',
        'auth.errors.invalidEmail': 'Por favor, ingresa un correo electrónico válido.',
        'auth.errors.passwordTooShort': 'La contraseña debe tener al menos 8 caracteres.',
        'auth.errors.emailRequired': 'El correo electrónico es requerido.',
        'auth.errors.passwordRequired': 'La contraseña es requerida.',
        'auth.login.error.oauthRequired': 'Este correo está asociado a una cuenta de Google. Inicia sesión con Google.',
        'auth.signup.error.oauthExists': 'Ya existe una cuenta con este correo a través de Google. Inicia sesión con Google o recupera tu contraseña.'
      };
      return keys[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() }
  })
}));

// Mock useUserApi
vi.mock('../hooks/useUserApi', () => ({
  useUserApi: () => ({
    preRegister: vi.fn().mockImplementation((data) => {
      if (data.email === 'api-oauth-exists@example.com') {
        return Promise.reject(new Error('oauth_provider_exists'));
      }
      return Promise.resolve();
    })
  })
}));

describe('LoginView Component', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    vi.stubGlobal('location', {
      ...originalLocation,
      href: ''
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders both tabs, input fields, and the submit button', () => {
    render(<LoginView />);

    expect(screen.getByRole('heading', { name: /bienvenido/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /iniciar sesión/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /registrarse/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/correo@ejemplo.com/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/^contraseña$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('switches tabs and updates submit button text', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    const signupTab = screen.getByRole('tab', { name: /registrarse/i });
    const loginTab = screen.getByRole('tab', { name: /iniciar sesión/i });

    // Click SignUp Tab
    await user.click(signupTab);
    expect(screen.getByRole('button', { name: /crear cuenta/i })).toBeInTheDocument();

    // Click Login Tab
    await user.click(loginTab);
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
  });

  it('renders the social divider and the Google button', () => {
    render(<LoginView />);

    expect(screen.getByText(/o continuar con/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument();
  });

  it('shows validation errors when fields are empty and submitted', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    const submitBtn = screen.getByRole('button', { name: /ingresar/i });
    await user.click(submitBtn);

    expect(screen.getByText(/el correo electrónico es requerido/i)).toBeInTheDocument();
    expect(screen.getByText(/la contraseña es requerida/i)).toBeInTheDocument();
  });

  it('shows error if email format is invalid', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /ingresar/i });

    await user.type(emailInput, 'invalidemail');
    await user.type(passwordInput, 'validpassword123');
    await user.click(submitBtn);

    expect(screen.getByText(/por favor, ingresa un correo electrónico válido/i)).toBeInTheDocument();
  });

  it('shows error if password is less than 8 characters', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /ingresar/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, '123');
    await user.click(submitBtn);

    expect(screen.queryByText(/el correo electrónico es requerido/i)).not.toBeInTheDocument();
    expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
  });

  it('triggers onLoginSuccess callback with valid inputs', async () => {
    vi.useFakeTimers();
    const handleLoginSuccess = vi.fn();

    render(<LoginView onLoginSuccess={handleLoginSuccess} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /ingresar/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'supersecurepassword' } });
    fireEvent.click(submitBtn);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    act(() => {
      vi.runAllTimers();
    });

    expect(handleLoginSuccess).toHaveBeenCalledWith({ email: 'test@example.com', isSignUp: false });
    vi.useRealTimers();
  });

  it('redirects to Google OAuth URL when Google button is clicked', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    const googleBtn = screen.getByRole('button', { name: /continuar con google/i });
    await user.click(googleBtn);

    expect(window.location.href).toBe('/api/v1/auth/google/login');
  });

  it('triggers onForgotPasswordClick when forgot password link is clicked', async () => {
    const user = userEvent.setup();
    const handleForgotPasswordClick = vi.fn();
    render(<LoginView onForgotPasswordClick={handleForgotPasswordClick} />);

    const forgotBtn = screen.getByRole('button', { name: /¿olvidaste tu contraseña\?/i });
    await user.click(forgotBtn);

    expect(handleForgotPasswordClick).toHaveBeenCalledTimes(1);
  });

  it('displays OAuth required banner on login collision error and allows setting password', async () => {
    const user = userEvent.setup();
    const handleForgotPasswordClick = vi.fn();
    render(<LoginView onForgotPasswordClick={handleForgotPasswordClick} />);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /ingresar/i });

    await user.type(emailInput, 'oauth-required@example.com');
    await user.type(passwordInput, 'validpassword123');
    await user.click(submitBtn);

    const alertBanner = await screen.findByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(screen.getByText(/este correo está asociado a una cuenta de google/i)).toBeInTheDocument();

    const forgotBtnInAlert = within(alertBanner).getByRole('button', { name: /¿olvidaste tu contraseña\?/i });
    await user.click(forgotBtnInAlert);
    expect(handleForgotPasswordClick).toHaveBeenCalledTimes(1);
  });

  it('displays OAuth exists banner on signup collision error and allows switching tabs', async () => {
    const user = userEvent.setup();
    const handleForgotPasswordClick = vi.fn();
    render(<LoginView onForgotPasswordClick={handleForgotPasswordClick} />);

    // Switch to Sign Up tab
    const signupTab = screen.getByRole('tab', { name: /registrarse/i });
    await user.click(signupTab);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /crear cuenta/i });

    await user.type(emailInput, 'oauth-exists@example.com');
    await user.type(passwordInput, 'validpassword123');
    await user.click(submitBtn);

    const alertBanner = await screen.findByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(screen.getByText(/ya existe una cuenta con este correo a través de google/i)).toBeInTheDocument();

    // Click on Iniciar Sesión button in the banner to switch tabs
    const loginBtnInAlert = screen.getByRole('button', { name: /iniciar sesión/i });
    await user.click(loginBtnInAlert);

    // Verify it switched back to login
    expect(screen.getByRole('button', { name: /ingresar/i })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('handles real API call with oauth_provider_exists error code', async () => {
    const user = userEvent.setup();
    render(<LoginView />);

    // Switch to Sign Up tab
    const signupTab = screen.getByRole('tab', { name: /registrarse/i });
    await user.click(signupTab);

    const emailInput = screen.getByLabelText(/correo electrónico/i);
    const passwordInput = screen.getByLabelText(/^contraseña$/i);
    const submitBtn = screen.getByRole('button', { name: /crear cuenta/i });

    await user.type(emailInput, 'api-oauth-exists@example.com');
    await user.type(passwordInput, 'validpassword123');
    await user.click(submitBtn);

    const alertBanner = await screen.findByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(screen.getByText(/ya existe una cuenta con este correo a través de google/i)).toBeInTheDocument();
  });
});
