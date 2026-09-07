import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useVerificationGuard } from "./useVerificationGuard";
import { useAuth } from "@context/AuthContext";
import { useUserProfile } from "./useUserProfile";

// Mock useNavigate and useLocation
const mockNavigate = vi.fn();
let mockPathname = "/user/dashboard";
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

// Mock useAuth
vi.mock("@context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

// Mock useUserProfile
vi.mock("./useUserProfile", () => ({
  useUserProfile: vi.fn(),
}));

describe("useVerificationGuard", () => {
  const mockFetchProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchProfile.mockReset();
    mockPathname = "/user/dashboard";
    vi.mocked(useUserProfile).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
      fetchProfile: mockFetchProfile,
    });
  });

  it("redirects to /auth/login if token is missing", () => {
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      setToken: vi.fn(),
      setUser: vi.fn(),
    });

    const { result } = renderHook(() => useVerificationGuard());

    expect(result.current.checking).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith("/auth/login", {
      replace: true,
      state: { from: "/user/dashboard" },
    });
  });

  describe("allowedStatus: unverified (default / VerifyPage)", () => {
    it("redirects to /user/dashboard if token is present, user is verified and profile complete", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: true, profile_complete: true } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      renderHook(() => useVerificationGuard({ allowedStatus: "unverified" }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/user/dashboard", { replace: true });
      });
    });

    it("redirects to /user/register if token is present, user is verified and profile incomplete", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: true, profile_complete: false } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      renderHook(() => useVerificationGuard({ allowedStatus: "unverified" }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/user/register", { replace: true });
      });
    });

    it("fetches profile if user is not in state, then redirects based on verification status", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: null,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      mockFetchProfile.mockResolvedValueOnce({
        isVerified: true,
        profile_complete: true,
      });

      renderHook(() => useVerificationGuard({ allowedStatus: "unverified" }));

      await waitFor(() => {
        expect(mockFetchProfile).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/user/dashboard", { replace: true });
      });
    });

    it("sets checking to false if user is not verified", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: false, profile_complete: false } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      const { result } = renderHook(() => useVerificationGuard({ allowedStatus: "unverified" }));

      await waitFor(() => {
        expect(result.current.checking).toBe(false);
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe("allowedStatus: verified (Protected Routes / Dashboard)", () => {
    it("redirects to /auth/verify if token is present but user is not verified", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: false, profile_complete: false } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      renderHook(() => useVerificationGuard({ allowedStatus: "verified" }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/auth/verify", { replace: true });
      });
    });

    it("redirects to /user/register if user is verified but profile is incomplete", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: true, profile_complete: false } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      renderHook(() => useVerificationGuard({ allowedStatus: "verified" }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/user/register", { replace: true });
      });
    });

    it("does not redirect to /user/register if user is verified, profile incomplete, but already on register page", async () => {
      mockPathname = "/user/register";
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: true, profile_complete: false } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      const { result } = renderHook(() => useVerificationGuard({ allowedStatus: "verified" }));

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.checking).toBe(false);
      });
    });

    it("sets checking to false and does not redirect if user is verified and profile is complete", async () => {
      vi.mocked(useAuth).mockReturnValue({
        token: "valid_token",
        user: { is_verified: true, profile_complete: true } as any,
        setToken: vi.fn(),
        setUser: vi.fn(),
      });

      const { result } = renderHook(() => useVerificationGuard({ allowedStatus: "verified" }));

      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.checking).toBe(false);
      });
    });
  });
});
