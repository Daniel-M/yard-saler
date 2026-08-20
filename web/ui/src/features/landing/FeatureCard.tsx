import React from 'react';
import { useTranslation } from 'react-i18next';

export interface FeatureCardProps {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
}

export function FeatureCard({ icon, titleKey, descriptionKey }: FeatureCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center p-6 bg-surface-elevated rounded-xl shadow-lg border border-border-subtle text-center">
      <div className="text-accent-blue mb-4 h-12 w-12 flex items-center justify-center bg-canvas rounded-full">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-content-primary mb-2">
        {t(titleKey)}
      </h3>
      <p className="text-content-secondary">
        {t(descriptionKey)}
      </p>
    </div>
  );
}
