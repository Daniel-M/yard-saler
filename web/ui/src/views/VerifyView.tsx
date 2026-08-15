import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  const { verify } = useUserApi();

  const code = searchParams.get('code');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Guard to prevent multiple simultaneous/subsequent fetch triggers (e.g. from React 18/19 double-mount behavior in Strict Mode)
  const verificationStarted = useRef(false);

  const performVerification = async (verificationCode: string) => {
    setStatus('loading');
    setErrorMsg(null);
    try {
      const data = await verify({ verificationCode });
      const token = data?.token || '';

      setStatus('success');
      
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
    if (verificationStarted.current) return;

    if (!code) {
      setStatus('error');
      setErrorMsg(t('auth.verify.error.missingCode'));
      if (onVerificationError) {
        onVerificationError(t('auth.verify.error.missingCode'));
      }
      return;
    }

    verificationStarted.current = true;
    performVerification(code);
  }, [code, onVerificationError, t]);

  const handleRetry = () => {
    if (code) {
      performVerification(code);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <main className="min-h-screen w-full bg-slate-950 text-content-primary flex items-center justify-center p-4 sm:p-6 md:p-8 font-sans transition-colors duration-150">
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
              {code && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="w-full bg-accent-purple hover:bg-accent-purple-hover text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all duration-150 shadow-md cursor-pointer flex items-center justify-center gap-2 min-h-[48px]"
                >
                  {t('auth.verify.error.retry')}
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
