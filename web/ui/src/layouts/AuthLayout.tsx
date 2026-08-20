import React from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-canvas text-content-primary flex flex-col font-sans transition-colors duration-150">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:py-12 w-full flex flex-col justify-center items-center">
        {children}
      </main>
      <Footer />
    </div>
  );
};
