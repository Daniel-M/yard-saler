import { AuthProvider } from "@context/AuthContext";
import { DrawerProvider } from "@context/DrawerContext";
import { ThemeProvider } from "@context/ThemeContext";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";

import App from "./App.tsx";
import "./i18n.ts";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <DrawerProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </DrawerProvider>
    </AuthProvider>
  </StrictMode>,
);
