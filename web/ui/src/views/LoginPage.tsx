import { useNavigate } from 'react-router-dom';
import LoginView from './LoginView';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = (data: { email: string; isSignUp: boolean }) => {
    console.log('Login success:', data);
    navigate('/');
  };

  const handleForgotPasswordClick = () => {
    navigate('/forgot-password');
  };

  return (
    <LoginView 
      onLoginSuccess={handleLoginSuccess}
      onForgotPasswordClick={handleForgotPasswordClick}
    />
  );
}
