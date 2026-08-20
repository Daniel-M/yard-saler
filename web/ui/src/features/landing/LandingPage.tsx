import React from 'react';
import { Navigate } from "react-router";
import { useAuth } from '@context/AuthContext';
import { useTranslation } from 'react-i18next';
import Layout from '@layouts/Layout';
import { HeroSection } from './HeroSection';
import { FeatureCard } from './FeatureCard';
import { ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  const { token } = useAuth();
  const { t } = useTranslation();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <main role="main" className="flex flex-col min-h-screen bg-canvas">
        <HeroSection />
        
        <section className="py-20 px-4 bg-canvas">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              titleKey="landing.features.speed.title"
              descriptionKey="landing.features.speed.desc"
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6" />}
              titleKey="landing.features.security.title"
              descriptionKey="landing.features.security.desc"
            />
          </div>
        </section>
      </main>
    </Layout>
  );
}
