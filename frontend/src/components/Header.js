'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Logout anyway on error
      router.push('/');
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                GlucoTrack
              </h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Dashboard
                  </Link>
                  <Link href="/chat" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    AI Chat
                  </Link>
                  <Link href="/analytics" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Analytics
                  </Link>
                  <Link href="/predictions" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    AI Predictions
                  </Link>
                  <Link href="/community" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Community
                  </Link>
                </>
              ) : (
                <>
                  <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Features
                  </a>
                  <a href="#about" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    About
                  </a>
                  <a href="#community" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                    Community
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <span className="text-sm font-medium">{user?.firstName}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Profile Settings
                    </Link>
                    <Link href="/caregivers" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Caregivers & Doctors
                    </Link>
                    <Link href="/reports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      Medical Reports
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/signin" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-3 py-2 border-b border-gray-100 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-white">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                </div>
                <Link href="/dashboard" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/chat" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  AI Chat
                </Link>
                <Link href="/analytics" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Analytics
                </Link>
                <Link href="/predictions" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  AI Predictions
                </Link>
                <Link href="/community" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Community
                </Link>
                <Link href="/caregivers" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Caregivers
                </Link>
                <Link href="/reports" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Reports
                </Link>
                <Link href="/profile" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Profile Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <a href="#features" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Features
                </a>
                <a href="#about" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  About
                </a>
                <a href="#community" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Community
                </a>
                <Link href="/signin" className="block text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors">
                  Sign In
                </Link>
                <Link href="/signup" className="block bg-gradient-to-r from-blue-600 to-green-600 text-white px-3 py-2 rounded-md text-base font-medium mx-3 text-center">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close profile dropdown */}
      {isProfileOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsProfileOpen(false)}
        />
      )}
    </header>
  );
}
