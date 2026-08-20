import { useAuth } from "@context/AuthContext";
import type { LoggedUserDTO } from "@type/auth.types";
import { useNavigate } from "react-router";

import LoginView from "../views/LoginView";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const handleLoginSuccess = (data: {
    user: LoggedUserDTO;
    is_sign_up: boolean;
    token?: string;
  }) => {
    console.log("Login success:", data);
    if (data.is_sign_up) {
      navigate("/auth/verify", { state: { fromSignUp: true } });
    } else {
      if (data.token) {
        setToken(data.token);
      }

      if (!data.user.profile_complete) {
        setUser(data.user);
        navigate("/user/register", { replace: true });
      }

      if (data.user) {
        setUser(data.user);
      }

      // navigate(location.state?.from || "/user/dashboard", { replace: true });
      navigate("/user/dashboard", { replace: true });
    }
  };

  const handleForgotPasswordClick = () => {
    navigate("/reset-password");
  };

  return (
    <LoginView
      onLoginSuccess={handleLoginSuccess}
      onForgotPasswordClick={handleForgotPasswordClick}
    />
  );
};

export default LoginPage;
