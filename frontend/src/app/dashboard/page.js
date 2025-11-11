'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '../../contexts/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import Layout from '../../components/Layout';
import CGMIntegration from '../../components/CGMIntegration';

// Dynamic imports for modal components
const GlucoseReadingsModal = dynamic(() => import('../../components/GlucoseReadingsModal'), { ssr: false });
const AddGlucoseModal = dynamic(() => import('../../components/AddGlucoseModal'), { ssr: false });
const AddMedicationModal = dynamic(() => import('../../components/AddMedicationModal'), { ssr: false });
const ReportsModal = dynamic(() => import('../../components/ReportsModal'), { ssr: false });
const SettingsModal = dynamic(() => import('../../components/SettingsModal'), { ssr: false });

export default function Dashboard() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const apiClient = useApiClient();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [glucoseData, setGlucoseData] = useState({ readings: [], stats: {} });
  const [medications, setMedications] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [cgmData, setCgmData] = useState(null);
  const [showGlucoseReadings, setShowGlucoseReadings] = useState(false);
  const [showAddGlucose, setShowAddGlucose] = useState(false);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadDashboardData();
    }
  }, [isAuthenticated, user]);

  const loadDashboardData = async () => {
    try {
      setIsLoadingData(true);
      
      // Token is automatically managed by useApiClient hook

      // Fetch dashboard stats (includes glucose and medication data)
      const statsResponse = await apiClient.getDashboardStats(7);
      
      // Fetch recent glucose readings
      const glucoseResponse = await apiClient.getGlucoseReadings({ limit: 10 });
      
      // Set glucose data from stats and readings
      setGlucoseData({
        readings: glucoseResponse.readings || [],
        stats: statsResponse.glucoseStats || {}
      });

      // Fetch medications
      const medicationsResponse = await apiClient.getMedications(true);
      setMedications(medicationsResponse.medications || []);

      // Fetch recent alerts
      const alertsResponse = await apiClient.getAlerts({ limit: 5, resolved: false });
      setAlerts(alertsResponse.alerts || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fall back to mock data if API fails
      setGlucoseData({
        readings: [
          { _id: '1', value: 120, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'normal' },
          { _id: '2', value: 95, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), status: 'normal' },
          { _id: '3', value: 140, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), status: 'high' }
        ],
        stats: {
          average: 118,
          timeInRange: 75,
          lowReadings: 2,
          highReadings: 3,
          count: 15
        }
      });
      setMedications([
        { _id: '1', name: 'Metformin', dosage: { amount: 500, unit: 'mg' }, frequency: { timesPerDay: 2 }, adherenceRate: 95 },
        { _id: '2', name: 'Insulin', dosage: { amount: 10, unit: 'units' }, frequency: { timesPerDay: 3 }, adherenceRate: 88 }
      ]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddGlucoseReading = async (value, mealContext = 'random', notes = '') => {
    try {
      const reading = {
        value: parseFloat(value),
        mealContext,
        notes,
        timestamp: new Date()
      };

      await apiClient.addGlucoseReading(reading);
      
      // Reload dashboard data to show the new reading
      await loadDashboardData();
      
      alert('Glucose reading added successfully!');
    } catch (error) {
      console.error('Error adding glucose reading:', error);
      alert('Failed to add glucose reading. Please try again.');
    }
  };

  const handleCGMData = async (reading) => {
    setCgmData(reading);
    
    // Auto-save CGM readings to the database (without reloading dashboard to prevent loops)
    if (reading && reading.value) {
      try {
        const glucoseReading = {
          value: parseFloat(reading.value),
          mealContext: 'cgm',
          notes: `CGM reading from ${reading.device}`,
          timestamp: reading.timestamp
        };
        
        await apiClient.addGlucoseReading(glucoseReading);
        console.log('CGM reading auto-saved to database');
      } catch (error) {
        console.error('Error auto-saving CGM reading:', error);
      }
    }
  };

  const showGlucoseForm = () => {
    setShowAddGlucose(true);
  };

  if (isLoading || isLoadingData) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect to sign-in
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2 animate-slide-up">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-slate-600 animate-slide-up animation-delay-100">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <button 
            onClick={() => setShowGlucoseReadings(true)}
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animation-delay-200 group text-left w-full"
          >
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Glucose Readings</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">{glucoseData.readings.length || 0}</p>
                <p className="text-xs text-slate-500">Click to view all</p>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animation-delay-300 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl group-hover:from-emerald-200 group-hover:to-emerald-300 transition-all duration-300">
                <svg className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Active Medications</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">
                  {medications.filter(med => med.isActive !== false).length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up animation-delay-400 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                <svg className="w-6 h-6 text-purple-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Days Since Join</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors duration-300">
                  {Math.floor((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24))}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 animate-slide-up animation-delay-500 hover:shadow-xl transition-all duration-300">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={showGlucoseForm}
              className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 text-center group transform hover:scale-105 hover:shadow-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors duration-300">Log Glucose</p>
            </button>

            <button 
              onClick={() => setShowAddMedication(true)}
              className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl transition-all duration-300 text-center group transform hover:scale-105 hover:shadow-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">Add Medication</p>
            </button>

            <button 
              onClick={() => setShowReports(true)}
              className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 text-center group transform hover:scale-105 hover:shadow-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-purple-700 transition-colors duration-300">View Reports</p>
            </button>

            <button 
              onClick={() => setShowSettings(true)}
              className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-xl transition-all duration-300 text-center group transform hover:scale-105 hover:shadow-lg"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-900 group-hover:text-orange-700 transition-colors duration-300">Settings</p>
            </button>
          </div>
        </div>

        {/* CGM Integration */}
        <div className="mb-8 animate-slide-up animation-delay-600">
          <CGMIntegration onDataReceived={handleCGMData} />
        </div>

        {/* Real-time CGM Display */}
        {cgmData && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 mb-8 animate-slide-up animation-delay-700 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest CGM Reading</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-3xl font-bold ${cgmData.value < 70 ? 'text-red-600' : cgmData.value > 180 ? 'text-orange-600' : 'text-green-600'}`}>
                      {cgmData.value}
                    </span>
                    <span className="text-gray-500">mg/dL</span>
                    <span className="text-lg">
                      {cgmData.trend === 'rising' ? '↗️' : cgmData.trend === 'falling' ? '↘️' : '→'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Device: {cgmData.device}</p>
                    <p>Updated: {cgmData.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Glucose Readings Modal */}
        {showGlucoseReadings && GlucoseReadingsModal && (
          <GlucoseReadingsModal 
            readings={glucoseData.readings}
            onClose={() => setShowGlucoseReadings(false)}
          />
        )}

        {/* Add Glucose Modal */}
        {showAddGlucose && AddGlucoseModal && (
          <AddGlucoseModal 
            onSubmit={async (glucoseData) => {
              try {
                await apiClient.addGlucoseReading(glucoseData);
                setShowAddGlucose(false);
                await loadDashboardData();
                alert('Glucose reading saved successfully!');
              } catch (error) {
                console.error('Error saving glucose reading:', error);
                alert('Failed to save glucose reading. Please try again.');
              }
            }}
            onClose={() => setShowAddGlucose(false)}
          />
        )}

        {/* Add Medication Modal */}
        {showAddMedication && AddMedicationModal && (
          <AddMedicationModal 
            onSubmit={async (medicationData) => {
              try {
                await apiClient.addMedication(medicationData);
                setShowAddMedication(false);
                await loadDashboardData();
                alert('Medication added successfully!');
              } catch (error) {
                console.error('Error adding medication:', error);
                alert('Failed to add medication. Please try again.');
              }
            }}
            onClose={() => setShowAddMedication(false)}
          />
        )}

        {/* Reports Modal */}
        {showReports && ReportsModal && (
          <ReportsModal 
            onClose={() => setShowReports(false)}
          />
        )}

        {/* Settings Modal */}
        {showSettings && SettingsModal && (
          <SettingsModal 
            user={user}
            onClose={() => setShowSettings(false)}
          />
        )}
       
      </div>
    </Layout>
  );
}
