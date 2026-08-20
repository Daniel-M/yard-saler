import ForgotPasswordPage from "@features/auth/pages/ForgotPasswordPage";
import LoginPage from "@features/auth/pages/LoginPage";
import RegistrationPage from "@features/auth/pages/RegistrationPage";
import VerifyPage from "@features/auth/pages/VerifyPage";
import DashboardPage from "@features/dashboard/pages/DashboardPage";
import DrawerLayout from "@layouts/DrawerLayout";
import BaseLayout from "@layouts/Layout";
import { Navigate, Route, Routes } from "react-router";
import SettingsView from "./views/SettingsView";
import YardSaleNewView from "./views/YardSaleNewView";
import YardSaleDetailView from "./views/YardSaleDetailView";
import ProductDetailView from "./views/ProductDetailView";
import ProductNewView from "./views/ProductNewView";

import "./i18n";

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
        <Route path="settings" element={<SettingsView />} />
        <Route path="yard-sales/new" element={<YardSaleNewView />} />
      </Route>
      <Route path="ys" element={<BaseLayout />}>
        <Route path="e/:event_code" element={<YardSaleDetailView />} />
        <Route path="e/:event_code/p/:product_code" element={<ProductDetailView />} />
      </Route>
      <Route element={<DrawerLayout />}>
        <Route path="ys/e/:event_code/products/new" element={<ProductNewView />} />
      </Route>
      <Route path="*" element={<Navigate to="/auth/login" replace />} />
    </Routes>
  );
}
