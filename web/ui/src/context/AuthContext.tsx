import type { LoggedUserDTO, UserProfile } from "@type/auth.types";
import React, {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserApiClient } from "../features/auth/api/auth.api";
import { LoadingSpinner } from "@components/LoadingSpinner";

export type { UserProfile };

interface AuthContextType {
  token: string | null;
  setToken: (token: string | null) => void;
  user: UserProfile | LoggedUserDTO | null;
  setUser: (user: UserProfile | LoggedUserDTO | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });
  const [user, setUser] = useState<UserProfile | LoggedUserDTO | null>(null);
  const [isInitializing, setIsInitializing] = useState(!!token && !isTest);

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
      setUser(null);
      setIsInitializing(false);
    }
  }, [token]);

  useEffect(() => {
    if (isTest || !token) {
      setIsInitializing(false);
      return;
    }

    let isMounted = true;
    const loadProfile = async () => {
      try {
        const client = new UserApiClient();
        const data = await client.getProfile();
        if (isMounted) {
          if (data) {
            const profile: UserProfile = {
              id: data.id,
              displayName: data.display_name,
              email: data.email,
              initials: data.initials,
              avatarUrl: data.avatar_url,
              firstName: data.first_name,
              lastName: data.last_name,
              isVerified: data.verified_at != null,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              verifiedAt: data.verified_at,
              mobilePhone: data.mobile_phone,
              socials: data.socials,
              profile_complete: data.profile_complete,
            };
            setUser(profile);
          } else {
            setToken(null);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile on init:", err);
        if (isMounted) {
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center" data-testid="loading-skeleton">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ token, setToken, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
