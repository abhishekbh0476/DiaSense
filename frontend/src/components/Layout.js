'use client';

import Header from './Header';
import Footer from './Footer';
import EmergencyMode from './EmergencyMode';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children, showFooter = true }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      {isAuthenticated && <EmergencyMode />}
    </div>
  );
}
