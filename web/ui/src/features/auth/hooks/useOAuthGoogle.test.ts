import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOAuthGoogle } from "./useOAuthGoogle";
import { useAuth } from "@context/AuthContext";
import { UserApiClient } from "../api/auth.api";

vi.mock("@context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/auth.api", () => {
  return {
    UserApiClient: vi.fn().mockImplementation(() => {
      return {
        oauthGoogle: vi.fn(),
      };
    }),
  };
});

describe("useOAuthGoogle", () => {
  const mockSetToken = vi.fn();
  const mockSetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      token: null,
      user: null,
      setToken: mockSetToken,
      setUser: mockSetUser,
      logout: vi.fn(),
    } as any);
  });

  it("should successfully authenticate with google and update AuthContext", async () => {
    const mockResponse = {
      token: "mock_jwt_token",
      is_sign_up: false,
      user: {
        id: "user_123",
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
        mobile_phone: "",
        is_verified: true,
        profile_complete: true,
        account_age: 1,
      },
    };

    const mockOauthGoogle = vi.fn().mockResolvedValue(mockResponse);
    vi.mocked(UserApiClient).mockImplementation(() => {
      return {
        oauthGoogle: mockOauthGoogle,
      } as any;
    });

    const { result } = renderHook(() => useOAuthGoogle());

    let response;
    await act(async () => {
      response = await result.current.mutate("google_credential_123");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.error).toBeNull();
    expect(response).toEqual(mockResponse);
    expect(mockOauthGoogle).toHaveBeenCalledWith("google_credential_123", expect.any(AbortSignal));
    expect(mockSetToken).toHaveBeenCalledWith("mock_jwt_token");
    expect(mockSetUser).toHaveBeenCalledWith(mockResponse.user);
  });

  it("should handle error during google authentication", async () => {
    const mockError = new Error("OAuth failed");
    const mockOauthGoogle = vi.fn().mockRejectedValue(mockError);
    vi.mocked(UserApiClient).mockImplementation(() => {
      return {
        oauthGoogle: mockOauthGoogle,
      } as any;
    });

    const { result } = renderHook(() => useOAuthGoogle());

    await act(async () => {
      await expect(result.current.mutate("google_credential_123")).rejects.toThrow("OAuth failed");
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.error).toEqual(mockError);
  });
});
