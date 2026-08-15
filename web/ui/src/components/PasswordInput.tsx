import React, { useState, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', ...props }, ref) => {
    const { t } = useTranslation();
    const [showPassword, setShowPassword] = useState(false);

    const toggleVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      setShowPassword((prev) => !prev);
    };

    return (
      <div className="relative w-full">
        <input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`${className} pr-12`}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          disabled={props.disabled}
          className="absolute inset-y-0 right-0 flex items-center justify-center p-3 text-content-muted hover:text-content-primary focus:outline-none focus:text-content-primary disabled:opacity-50 disabled:pointer-events-none cursor-pointer min-w-[48px] min-h-[48px]"
          aria-label={showPassword ? t('auth.fields.hidePassword') : t('auth.fields.showPassword')}
        >
          {showPassword ? (
            <EyeOff className="h-5 w-5 animate-in fade-in duration-200" data-testid="eye-off-icon" />
          ) : (
            <Eye className="h-5 w-5 animate-in fade-in duration-200" data-testid="eye-icon" />
          )}
        </button>
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
