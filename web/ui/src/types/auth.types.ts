export interface UserPreRegisterDTO {
  email: string;
  password?: string;
}

export interface UserVerifyDTO {
  email?: string;
  verification_code: string;
}

export interface UserDTO {
  firstName?: string;
  lastName?: string;
  mobilePhone?: string;
  socials?: string[];
}

export interface UserPasswordResetDTO {
  passwordChangeCode: string;
  password?: string;
}

export interface UserLoginResponseDTO {
  token: string;
  is_sign_up: boolean;
  user: LoggedUserDTO;
}

export interface LoggedUserDTO {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile_phone: string;
  is_verified: boolean;
  profile_complete: boolean;
  account_age: number;
  // UI-friendly optional fields
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  mobilePhone?: string;
  socials?: string;
  initials?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  verifiedAt?: string | null;
}

export interface ForgotPasswordRequestDTO {
  email: string;
}

export interface UserResponseDTO {
  id: string;
  display_name: string;
  email: string;
  initials: string;
  avatar_url?: string;
  first_name?: string;
  last_name?: string;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
  mobile_phone?: string;
  socials?: string;
  profile_complete: boolean;
  account_age: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  initials: string;
  avatarUrl?: string;
  firstName?: string;
  lastName?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  verifiedAt: string | null;
  mobilePhone?: string;
  socials?: string;
  profile_complete?: boolean;
}
