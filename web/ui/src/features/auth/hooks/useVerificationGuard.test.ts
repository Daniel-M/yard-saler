import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVerificationGuard } from './useVerificationGuard';
import { useAuth } from '@context/AuthContext';
import { useUserProfile } from './useUserProfile';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock useAuth
vi.mock('@context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock useUserProfile
vi.mock('./useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

describe('useVerificationGuard', () => {
  const mockFetchProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProfile.mockReset();
    vi.mocked(useUserProfile).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      fetchProfile: mockFetchProfile,
    });
  });

  it('redirects to /auth/login if token is missing', () => {
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      setToken: vi.fn(),
      setUser: vi.fn(),
    });

    const { result } = renderHook(() => useVerificationGuard());

    expect(result.current.checking).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { replace: true });
  });

  it('redirects to /user/dashboard if token is present, user is verified and profile complete', async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: 'valid_token',
      user: { is_verified: true, profile_complete: true } as any,
      setToken: vi.fn(),
      setUser: vi.fn(),
    });

    renderHook(() => useVerificationGuard());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user/dashboard', { replace: true });
    });
  });

  it('redirects to /user/register if token is present, user is verified and profile incomplete', async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: 'valid_token',
      user: { is_verified: true, profile_complete: false } as any,
      setToken: vi.fn(),
      setUser: vi.fn(),
    });

    renderHook(() => useVerificationGuard());

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/user/register', { replace: true });
    });
  });

  it('fetches profile if user is not in state, then redirects based on verification status', async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: 'valid_token',
      user: null,
      setToken: vi.fn(),
      setUser: vi.fn(),
    });

    mockFetchProfile.mockResolvedValueOnce({
      isVerified: true,
      profile_complete: true,
    });

    renderHook(() => useVerificationGuard());

    await waitFor(() => {
      expect(mockFetchProfile).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/user/dashboard', { replace: true });
    });
  });

  it('sets checking to false if user is not verified', async () => {
    vi.mocked(useAuth).mockReturnValue({
      token: 'valid_token',
      user: { is_verified: false, profile_complete: false } as any,
      setToken: vi.fn(),
      setUser: vi.fn(),
    });

    const { result } = renderHook(() => useVerificationGuard());

    await waitFor(() => {
      expect(result.current.checking).toBe(false);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
