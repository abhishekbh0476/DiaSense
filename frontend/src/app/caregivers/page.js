'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

export default function Caregivers() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('caregivers');
  const [caregivers, setCaregivers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCaregiverData();
    }
  }, [isAuthenticated]);

  const loadCaregiverData = () => {
    // Mock data
    setCaregivers([
      {
        id: 1,
        name: 'Sarah Johnson',
        relationship: 'Spouse',
        phone: '+1 (555) 123-4567',
        email: 'sarah.johnson@email.com',
        alertsEnabled: true,
        emergencyContact: true,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
        avatar: 'SJ'
      },
      {
        id: 2,
        name: 'Michael Johnson',
        relationship: 'Son',
        phone: '+1 (555) 987-6543',
        email: 'michael.j@email.com',
        alertsEnabled: true,
        emergencyContact: false,
        lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
        avatar: 'MJ'
      }
    ]);

    setDoctors([
      {
        id: 1,
        name: 'Dr. Emily Chen',
        specialty: 'Endocrinologist',
        hospital: 'City Medical Center',
        phone: '+1 (555) 234-5678',
        email: 'dr.chen@citymedical.com',
        nextAppt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        avatar: 'EC',
        verified: true
      },
      {
        id: 2,
        name: 'Dr. Robert Martinez',
        specialty: 'Nutritionist',
        hospital: 'Wellness Clinic',
        phone: '+1 (555) 345-6789',
        email: 'dr.martinez@wellness.com',
        nextAppt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        avatar: 'RM',
        verified: true
      }
    ]);

    setAlerts([
      {
        id: 1,
        type: 'critical',
        message: 'Low blood sugar detected (65 mg/dL)',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        sentTo: ['Sarah Johnson', 'Dr. Emily Chen'],
        acknowledged: false
      },
      {
        id: 2,
        type: 'warning',
        message: 'Missed medication reminder',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        sentTo: ['Sarah Johnson'],
        acknowledged: true
      }
    ]);
  };

  const generateReport = async () => {
    setIsGeneratingReport(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGeneratingReport(false);
      // In real app, this would trigger a download
      alert('Weekly report generated and sent to your healthcare providers!');
    }, 3000);
  };

  const sendEmergencyAlert = () => {
    // Simulate emergency alert
    const newAlert = {
      id: Date.now(),
      type: 'emergency',
      message: 'Emergency SOS activated - Immediate assistance needed',
      timestamp: new Date(),
      sentTo: caregivers.filter(c => c.emergencyContact).map(c => c.name),
      acknowledged: false
    };
    setAlerts(prev => [newAlert, ...prev]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading caregiver dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
            Caregiver & Doctor Dashboard
          </h1>
          <p className="text-slate-600 mt-2 animate-slide-up animation-delay-100">
            Manage your care team and share health data securely
          </p>
        </div>

        {/* Emergency SOS Button */}
        <div className="mb-8 animate-slide-up animation-delay-200">
          <div className="bg-gradient-to-r from-red-50 to-pink-100 rounded-2xl p-6 border-2 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center animate-pulse shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Emergency SOS</h3>
                  <p className="text-slate-600">One-tap emergency alert to your care team</p>
                </div>
              </div>
              <button
                onClick={sendEmergencyAlert}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-red-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-xl animate-bounce-gentle"
              >
                SEND SOS
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8 animate-slide-up animation-delay-300">
          <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
            {[
              { id: 'caregivers', label: 'Family Caregivers', icon: '👥' },
              { id: 'doctors', label: 'Healthcare Team', icon: '🩺' },
              { id: 'alerts', label: 'Alert History', icon: '🔔' },
              { id: 'reports', label: 'Medical Reports', icon: '📊' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="animate-fade-in">
          {/* Caregivers Tab */}
          {activeTab === 'caregivers' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Family Caregivers</h2>
                <button className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Add Caregiver
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {caregivers.map((caregiver, index) => (
                  <div
                    key={caregiver.id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                          {caregiver.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{caregiver.name}</h3>
                          <p className="text-slate-600 text-sm">{caregiver.relationship}</p>
                        </div>
                      </div>
                      {caregiver.emergencyContact && (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                          Emergency Contact
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{caregiver.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span>{caregiver.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          Last active: {caregiver.lastActive.toLocaleDateString()}
                        </span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${caregiver.alertsEnabled ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                          <span className="text-xs text-slate-500">
                            {caregiver.alertsEnabled ? 'Alerts On' : 'Alerts Off'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctors Tab */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Healthcare Team</h2>
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                  Add Doctor
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                          {doctor.avatar}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{doctor.name}</h3>
                          <p className="text-slate-600 text-sm">{doctor.specialty}</p>
                        </div>
                      </div>
                      {doctor.verified && (
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{doctor.hospital}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4zm-6 4a2 2 0 100-4 2 2 0 000 4zm6 0a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        <span>Next: {doctor.nextAppt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300">
                          Send Report
                        </button>
                        <button className="flex-1 bg-slate-100 text-slate-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-slate-200 transition-all duration-300">
                          Message
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-900">Alert History</h2>
              
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className={`rounded-2xl p-6 border-l-4 animate-slide-up ${
                      alert.type === 'emergency' 
                        ? 'bg-red-50 border-red-500' 
                        : alert.type === 'critical'
                        ? 'bg-orange-50 border-orange-500'
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${
                            alert.type === 'emergency' ? 'bg-red-500 animate-pulse' :
                            alert.type === 'critical' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}></div>
                          <h3 className="font-semibold text-slate-900">{alert.message}</h3>
                        </div>
                        <p className="text-slate-600 text-sm mb-2">
                          Sent to: {alert.sentTo.join(', ')}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {alert.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {alert.acknowledged ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            Acknowledged
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium animate-pulse">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900">Medical Reports</h2>
                <button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-2 rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    'Generate Weekly Report'
                  )}
                </button>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-teal-100 rounded-2xl p-8 border border-emerald-200">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">Automated Medical Reports</h3>
                  <p className="text-slate-600 mb-6">
                    Generate comprehensive reports with glucose trends, medication adherence, and AI insights for your healthcare team
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <h4 className="font-semibold text-slate-900 mb-2">Weekly Summary</h4>
                      <p className="text-slate-600 text-sm">Glucose trends, averages, and patterns</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <h4 className="font-semibold text-slate-900 mb-2">Medication Log</h4>
                      <p className="text-slate-600 text-sm">Adherence rates and timing analysis</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <h4 className="font-semibold text-slate-900 mb-2">AI Insights</h4>
                      <p className="text-slate-600 text-sm">Predictions and recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
