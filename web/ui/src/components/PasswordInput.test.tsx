import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from './PasswordInput';
import { vi, describe, it, expect } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => {
      const keys: Record<string, string> = {
        'auth.fields.showPassword': 'Show password',
        'auth.fields.hidePassword': 'Hide password',
      };
      return keys[str] || str;
    },
    i18n: { changeLanguage: () => Promise.resolve() },
  }),
}));

describe('PasswordInput Component', () => {
  it('renders input with type password and the show password toggle button by default', () => {
    render(<PasswordInput placeholder="Enter password" />);

    const input = screen.getByPlaceholderText('Enter password');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('toggles input type between password and text when button is clicked', async () => {
    const user = userEvent.setup();
    render(<PasswordInput placeholder="Enter password" />);

    const input = screen.getByPlaceholderText('Enter password');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Click to show password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    expect(screen.getByTestId('eye-off-icon')).toBeInTheDocument();

    // Click again to hide password
    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('forwards custom className and standard attributes to input', () => {
    render(
      <PasswordInput
        placeholder="Custom input"
        className="custom-class"
        disabled
        required
      />
    );

    const input = screen.getByPlaceholderText('Custom input');
    expect(input).toHaveClass('custom-class');
    expect(input).toBeDisabled();
    expect(input).toBeRequired();

    const toggleButton = screen.getByRole('button', { name: /show password/i });
    expect(toggleButton).toBeDisabled();
  });
});
