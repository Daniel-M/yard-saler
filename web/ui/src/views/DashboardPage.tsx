import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import LandingView from '../features/listings/components/LandingView';

export default function DashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const status = localStorage.getItem('user_status');
    if (status === 'VERIFIED_PENDING_DETAILS') {
      navigate('/register-details', { replace: true });
    }
  }, [navigate]);

  return (
    <Layout>
      <LandingView />
    </Layout>
  );
}
