import type { LoggedUserDTO, UserProfile } from "@type/auth.types";
import React, {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("paseto_token") || localStorage.getItem("token");
  });
  const [user, setUser] = useState<UserProfile | LoggedUserDTO | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("paseto_token", token);
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("paseto_token");
      localStorage.removeItem("token");
      setUser(null);
    }
  }, [token]);

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
