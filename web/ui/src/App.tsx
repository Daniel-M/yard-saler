import { Routes, Route } from 'react-router-dom';
import LandingPage from './views/LandingPage';
import DashboardPage from './views/DashboardPage';
import LoginPage from './views/LoginPage';
import ForgotPasswordPage from './views/ForgotPasswordPage';
import VerifyView from './views/VerifyView';
import RegistrationDetailsView from './views/RegistrationDetailsView';
import './i18n';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify" element={<VerifyView />} />
      <Route path="/register-details" element={<RegistrationDetailsView />} />
    </Routes>
  );
}
