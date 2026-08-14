import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess?: (data: { email: string; isSignUp: boolean }) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = t('auth.errors.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.errors.invalidEmail');
    }

    if (!password) {
      newErrors.password = t('auth.errors.passwordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('auth.errors.passwordTooShort');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    // Simulate Auth API call
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess({ email, isSignUp: activeTab === 'signup' });
      }
    }, 1000);
  };

  const handleGoogleLogin = () => {
    window.location.href = '/api/v1/auth/google/login';
  };

  return (
    <main className="min-h-screen w-full bg-canvas text-content-primary flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-150">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 transition-all duration-150">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent-purple to-accent-blue flex items-center justify-center shadow-lg shadow-accent-purple/20">
            {activeTab === 'login' ? (
              <LogIn className="h-6 w-6 text-white" />
            ) : (
              <UserPlus className="h-6 w-6 text-white" />
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-content-primary">
            {t('auth.title')}
          </h2>
          <p className="text-sm text-content-secondary">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Auth Mode Tabs (Switchable) */}
        <div className="flex border-b border-border-subtle" role="tablist" aria-label="Auth tabs">
          <button
            id="tab-login"
            type="button"
            role="tab"
            aria-selected={activeTab === 'login'}
            aria-controls="auth-panel"
            onClick={() => {
              setActiveTab('login');
              setErrors({});
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer text-center ${
              activeTab === 'login'
                ? 'border-border-interactive text-content-primary'
                : 'border-transparent text-content-muted hover:text-content-secondary'
            }`}
          >
            {t('auth.tabs.login')}
          </button>
          <button
            id="tab-signup"
            type="button"
            role="tab"
            aria-selected={activeTab === 'signup'}
            aria-controls="auth-panel"
            onClick={() => {
              setActiveTab('signup');
              setErrors({});
            }}
            className={`flex-1 pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer text-center ${
              activeTab === 'signup'
                ? 'border-border-interactive text-content-primary'
                : 'border-transparent text-content-muted hover:text-content-secondary'
            }`}
          >
            {t('auth.tabs.signup')}
          </button>
        </div>

        {/* Credentials Form Panel */}
        <form
          id="auth-panel"
          role="tabpanel"
          aria-labelledby={activeTab === 'login' ? 'tab-login' : 'tab-signup'}
          onSubmit={handleSubmit}
          className="flex flex-col gap-4"
          noValidate
        >
          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-content-secondary tracking-wide">
              {t('auth.fields.email')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.fields.emailPlaceholder')}
                className={`w-full pl-10 pr-4 py-2.5 bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.email
                    ? 'border-rose-500 focus:ring-rose-500/25 focus:border-rose-500'
                    : 'border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive'
                }`}
                aria-invalid={errors.email ? 'true' : 'false'}
                aria-describedby={errors.email ? 'email-error' : undefined}
                disabled={isLoading}
                required
              />
            </div>
            {errors.email && (
              <span id="email-error" className="text-xs text-rose-400 mt-0.5" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-content-secondary tracking-wide">
              {t('auth.fields.password')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-content-muted">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.fields.passwordPlaceholder')}
                className={`w-full pl-10 pr-4 py-2.5 bg-surface-elevated border rounded-xl text-sm text-content-primary placeholder-content-muted focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.password
                    ? 'border-rose-500 focus:ring-rose-500/25 focus:border-rose-500'
                    : 'border-border-subtle focus:ring-border-interactive/25 focus:border-border-interactive'
                }`}
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? 'password-error' : undefined}
                disabled={isLoading}
                required
              />
            </div>
            {errors.password && (
              <span id="password-error" className="text-xs text-rose-400 mt-0.5" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-accent-purple hover:bg-accent-purple-hover disabled:bg-accent-purple/50 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              activeTab === 'login' ? t('auth.buttons.loginSubmit') : t('auth.buttons.signupSubmit')
            )}
          </button>
        </form>

        {/* Social Divider */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-subtle"></div>
          <span className="flex-shrink mx-4 text-content-muted text-xs font-semibold uppercase tracking-wider">
            {t('auth.labels.divider')}
          </span>
          <div className="flex-grow border-t border-border-subtle"></div>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-surface-elevated hover:bg-surface disabled:opacity-50 text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
        >
          {/* Google Icon SVG */}
          <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <g transform="matrix(1, 0, 0, 1, 0, 0)">
              <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.48c0,-0.61 -0.06,-1.2 -0.16,-1.72z" fill="#4285F4" />
              <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.92,0.61 -2.1,0.98 -3.46,0.98c-2.35,0 -4.34,-1.59 -5.05,-3.72H2.74v2.66c1.48,2.94 4.52,4.86 8.01,4.86z" fill="#34A853" />
              <path d="M6.95,13.08a5.53,5.53,0,0,1,0,-3.36V7.06H2.74a9.9,9.9,0,0,0,0,8.68l4.21,-2.66z" fill="#FBBC05" />
              <path d="M12,6.12c1.32,0 2.51,0.45 3.44,1.35l2.58,-2.58C16.46,3.48 14.42,2.6 12,2.6c-3.49,0 -6.53,1.92 -8.01,4.86L8.2,10.12c0.71,-2.13 2.7,-3.72 5.05,-3.72z" fill="#EA4335" />
            </g>
          </svg>
          {t('auth.buttons.googleOAuth')}
        </button>

      </div>
    </main>
  );
}
