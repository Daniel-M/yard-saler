import { useNavigate } from 'react-router-dom';
import ForgotPasswordView from './ForgotPasswordView';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleResetSubmit = (email: string) => {
    console.log('Reset submitted for:', email);
    // TODO: integrate API
  };

  const handleBackToLoginClick = () => {
    navigate('/login');
  };

  return (
    <ForgotPasswordView 
      onRecoveryInitiated={handleResetSubmit}
      onBackToLogin={handleBackToLoginClick}
    />
  );
}
