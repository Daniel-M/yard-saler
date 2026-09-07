import { useAuth } from "@context/AuthContext";
import type { LoggedUserDTO } from "@type/auth.types";
import { useEffect } from "react";
import { useNavigate } from "react-router";

import LoginView from "../views/LoginView";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { token, setToken, user, setUser } = useAuth();

  useEffect(() => {
    if (token) {
      if (user && !user.profile_complete) {
        navigate("/user/register", { replace: true });
      } else {
        navigate("/user/dashboard", { replace: true });
      }
    }
  }, [token, user, navigate]);

  const handleLoginSuccess = (data: {
    user: LoggedUserDTO;
    is_sign_up: boolean;
    token?: string;
  }) => {
    console.log("Login success:", data);

    if (data.user) {
      setUser(data.user);
    }
    if (data.token) {
      setToken(data.token);
    }
    if (data.is_sign_up) {
      navigate("/auth/verify", { state: { fromSignUp: true } });
      return;
    }
    if (!data.user.profile_complete) {
      navigate("/user/register", { replace: true });
    } else {
      navigate("/user/dashboard", { replace: true });
    }
  };

  const handleForgotPasswordClick = () => {
    navigate("/auth/reset-password");
  };

  return (
    <LoginView
      onLoginSuccess={handleLoginSuccess}
      onForgotPasswordClick={handleForgotPasswordClick}
    />
  );
};

export default LoginPage;
