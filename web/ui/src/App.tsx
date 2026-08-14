import { useEffect, useState } from 'react';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './components/LandingPage';
import LoginView from './LoginView';
import './i18n';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  if (currentPath === '/login') {
    return <LoginView />;
  }

  return (
    <Layout>
      <LandingPage />
    </Layout>
  );
}
