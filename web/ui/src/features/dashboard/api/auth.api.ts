import { apiClient } from "@services/api/client";
import type {
  UserPreRegisterDTO,
  UserVerifyDTO,
  UserDTO,
  UserPasswordResetDTO,
  UserLoginResponseDTO,
  UserResponseDTO,
} from "../types/auth.types";

type UserApiClientConfig = {
  baseUrl?: string;
};

export class UserApiClient {
  private _apiClient: typeof apiClient;
  private _baseUrl: string | undefined;

  constructor(args?: UserApiClientConfig) {
    this._baseUrl = args?.baseUrl;
    this._apiClient = apiClient;
  }

  async preRegister(
    data: UserPreRegisterDTO,
    signal?: AbortSignal,
  ): Promise<void> {
    return this._apiClient<void>("/user/details/register", {
      method: "POST",
      body: JSON.stringify(data),
      signal,
      baseUrl: this._baseUrl,
    });
  }

  async verify(
    data: UserVerifyDTO,
    signal?: AbortSignal,
  ): Promise<UserLoginResponseDTO> {
    return this._apiClient<UserLoginResponseDTO>("/user/auth/verify", {
      method: "POST",
      body: JSON.stringify(data),
      signal,
      baseUrl: this._baseUrl,
    });
  }

  async editDetails(
    data: UserDTO,
    signal?: AbortSignal,
  ): Promise<UserResponseDTO> {
    const payload: Record<string, unknown> = {};
    if (data.firstName !== undefined) payload.first_name = data.firstName;
    if (data.lastName !== undefined) payload.last_name = data.lastName;
    if (data.mobilePhone !== undefined) payload.mobile_phone = data.mobilePhone;
    if (data.socials !== undefined) {
      payload.socials = data.socials.join(", ");
    }
    return this._apiClient<UserResponseDTO>("/user/details", {
      method: "PUT",
      body: JSON.stringify(payload),
      baseUrl: this._baseUrl,
      signal,
    });
  }

  async passwordReset(
    data: UserPasswordResetDTO,
    signal?: AbortSignal,
  ): Promise<void> {
    return this._apiClient<void>("/user/auth/password-reset", {
      method: "POST",
      body: JSON.stringify(data),
      baseUrl: this._baseUrl,
      signal,
    });
  }

  async getProfile(signal?: AbortSignal): Promise<UserResponseDTO> {
    return this._apiClient<UserResponseDTO>("/user/me", {
      method: "GET",
      baseUrl: this._baseUrl,
      signal,
    });
  }

  async login(
    data: UserPreRegisterDTO,
    signal?: AbortSignal,
  ): Promise<UserLoginResponseDTO> {
    return this._apiClient<UserLoginResponseDTO>("/user/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      baseUrl: this._baseUrl,
      signal,
    });
  }

  async forgotPassword(email: string, signal?: AbortSignal): Promise<void> {
    return this._apiClient<void>("/user/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      baseUrl: this._baseUrl,
      signal,
    });
  }
}
