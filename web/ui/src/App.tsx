import ForgotPasswordPage from "@features/auth/pages/ForgotPasswordPage";
import LoginPage from "@features/auth/pages/LoginPage";
import RegistrationPage from "@features/auth/pages/RegistrationPage";
import VerifyPage from "@features/auth/pages/VerifyPage";
import DashboardPage from "@features/dashboard/pages/DashboardPage";
import DrawerLayout from "@layouts/DrawerLayout";
import BaseLayout from "@layouts/Layout";
import { Navigate, Route, Routes } from "react-router";

import "./i18n";

// <Route path="auth" element={<Layout />}>

export default function App() {
  return (
    <Routes>
      <Route path="auth" element={<BaseLayout />}>
        <Route index element={<Navigate to="/auth/login" replace />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="verify" element={<VerifyPage />} />
        <Route path="reset-password" element={<ForgotPasswordPage />} />
      </Route>
      <Route path="user" element={<DrawerLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="register" element={<RegistrationPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
