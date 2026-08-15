import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useUserApi } from '../hooks/useUserApi';

export interface VerifyViewProps {
  onVerificationSuccess?: (token: string) => void;
  onVerificationError?: (error: string) => void;
}

export default function VerifyView({
  onVerificationSuccess,
  onVerificationError,
}: VerifyViewProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { verify } = useUserApi();

  const code = searchParams.get('code');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // Guard to prevent multiple simultaneous/subsequent fetch triggers (e.g. from React 18/19 double-mount behavior in Strict Mode)
  const verificationStarted = useRef(false);

  const performVerification = async (verificationCode: string) => {
    setStatus('loading');
    setErrorMsg(null);
    try {
      const data = await verify({ verificationCode });
      const token = data?.token || '';

      setStatus('success');
      
      if (token) {
        localStorage.setItem('user_status', 'VERIFIED_PENDING_DETAILS');
        localStorage.setItem('paseto_token', token);
      }
      
      if (onVerificationSuccess) {
        onVerificationSuccess(token);
      }

      // Automatically navigate to register-details page after 1.5 seconds on success
      setTimeout(() => {
        navigate('/register-details');
      }, 1500);
    } catch (err: any) {
      const msg = err.message || t('auth.verify.error.invalidCode');
      setStatus('error');
      setErrorMsg(msg);
      if (onVerificationError) {
        onVerificationError(msg);
      }
    }
  };

  useEffect(() => {
    // Show toast for 5 seconds if redirected from sign-up
    if (location.state?.fromSignUp) {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    if (!code) {
      // If no code, remain in idle state to show manual entry form
      setStatus('idle');
      return;
    }

    if (verificationStarted.current) return;
    verificationStarted.current = true;
    performVerification(code);
  }, [code]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.length === 6) {
      performVerification(manualCode);
    }
  };

  const handleExploreAsGuest = () => {
    localStorage.setItem('user_status', 'UNVERIFIED');
    navigate('/dashboard');
  };

  const handleRetry = () => {
    const codeToVerify = code || manualCode;
    if (codeToVerify) {
      performVerification(codeToVerify);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 text-content-primary flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-150 relative">
      {/* Toast Notification */}
      {showToast && (
        <div
          className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-6 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300"
          role="status"
          data-testid="signup-toast"
        >
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">{t('auth.verify.toastSent')}</span>
        </div>
      )}

      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 transition-all duration-150">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center text-center gap-6 py-6" data-testid="loading-state">
            <div className="h-16 w-16 rounded-full bg-accent-blue/10 text-accent-blue flex items-center justify-center shadow-lg shadow-accent-blue/10">
              <Loader2 className="h-8 w-8 animate-spin animate-infinite" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-content-primary">
                {t('auth.verify.title')}
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed animate-pulse">
                {t('auth.verify.loading')}
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center gap-6 py-6" data-testid="success-state">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-content-primary">
                {t('auth.verify.title')}
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed">
                {t('auth.verify.success')}
              </p>
            </div>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex flex-col gap-6 py-2" data-testid="idle-state">
            <div className="flex flex-col items-center text-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-content-primary">
                {t('auth.verify.title')}
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed">
                {t('auth.verify.loading')}
              </p>
            </div>

            <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="verificationCode" className="text-xs font-semibold text-content-secondary tracking-wide">
                  {t('auth.verify.manual.label')}
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  maxLength={6}
                  pattern="\d{6}"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('auth.verify.manual.placeholder')}
                  className="w-full text-center tracking-[0.5em] text-lg font-bold py-2.5 bg-surface-elevated border border-border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-border-interactive/25 focus:border-border-interactive transition-all duration-150 min-h-[48px]"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={manualCode.length !== 6 || status === 'loading'}
                className="w-full bg-accent-blue hover:bg-accent-blue-hover disabled:opacity-50 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                {t('auth.verify.manual.submit')}
              </button>
            </form>

            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleExploreAsGuest}
                className="w-full flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
              >
                {t('auth.verify.exploreAsGuest')}
              </button>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors cursor-pointer min-h-[36px]"
              >
                {t('auth.verify.error.backToLogin')}
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-center gap-6 py-6" data-testid="error-state">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/10">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-content-primary">
                {t('auth.verify.error.title')}
              </h2>
              <p className="text-sm text-content-secondary leading-relaxed" role="alert">
                {errorMsg}
              </p>
            </div>
            <div className="w-full flex flex-col gap-3 mt-4">
              <button
                type="button"
                onClick={handleRetry}
                className="w-full bg-accent-purple hover:bg-accent-purple-hover text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
              >
                {t('auth.verify.error.retry')}
              </button>
              {!code && (
                <button
                  type="button"
                  onClick={handleExploreAsGuest}
                  className="w-full flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
                >
                  {t('auth.verify.exploreAsGuest')}
                </button>
              )}
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full flex items-center justify-center gap-2 bg-surface-elevated hover:bg-surface text-content-primary border border-border-subtle hover:border-border-interactive/50 font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-sm cursor-pointer min-h-[48px]"
              >
                {t('auth.verify.error.backToLogin')}
              </button>
            </div>
          </div>
        )}
        
      </div>
    </main>
  );
}
