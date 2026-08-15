import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageToggle } from './LanguageToggle';
import { vi, describe, it, expect, beforeEach } from 'vitest';

const mockChangeLanguage = vi.fn(() => Promise.resolve());
let currentLanguage = 'es';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (str: string) => str,
    i18n: {
      language: currentLanguage,
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe('LanguageToggle component', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear();
    currentLanguage = 'es';
  });

  it('renders language toggle button with target language EN when current language is ES', () => {
    currentLanguage = 'es';
    render(<LanguageToggle />);

    const button = screen.getByRole('button', { name: /common.language.toggleLabel/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.getByTestId('languages-icon')).toBeInTheDocument();
  });

  it('renders language toggle button with target language ES when current language is EN', () => {
    currentLanguage = 'en';
    render(<LanguageToggle />);

    const button = screen.getByRole('button', { name: /common.language.toggleLabel/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('ES')).toBeInTheDocument();
  });

  it('calls changeLanguage with the opposite locale when clicked', async () => {
    const user = userEvent.setup();
    currentLanguage = 'es';
    render(<LanguageToggle />);

    const button = screen.getByRole('button', { name: /common.language.toggleLabel/i });
    await user.click(button);

    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });
});
