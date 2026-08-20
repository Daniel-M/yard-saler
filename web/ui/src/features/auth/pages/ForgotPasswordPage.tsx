import { useNavigate } from "react-router";

import ForgotPasswordView from "../views/ForgotPasswordView";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleResetSubmit = (email: string) => {
    console.log("Reset submitted for:", email);
    // TODO: integrate API
  };

  const handleBackToLoginClick = () => {
    navigate("/auth/login");
  };

  return (
    <ForgotPasswordView
      onRecoveryInitiated={handleResetSubmit}
      onBackToLogin={handleBackToLoginClick}
    />
  );
}
