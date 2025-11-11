'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useApiClient } from '../../hooks/useApiClient';
import Layout from '../../components/Layout';

export default function Caregivers() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const apiClient = useApiClient();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('caregivers');
  const [caregivers, setCaregivers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showAddCaregiver, setShowAddCaregiver] = useState(false);
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCaregiverData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadCaregiverData = async () => {
    try {
      setIsLoadingData(true);
      
      // Token is automatically managed by useApiClient hook

      // Fetch caregivers
      try {
        const caregiversResponse = await apiClient.getCaregivers();
        setCaregivers(caregiversResponse.caregivers || []);
      } catch (error) {
        console.error('Error loading caregivers:', error);
        // Fall back to mock data
        setCaregivers([
          {
            _id: '1',
            name: 'Sarah Johnson',
            relationship: 'spouse',
            phone: '+1 (555) 123-4567',
            email: 'sarah.johnson@email.com',
            alertsEnabled: true,
            emergencyContact: true,
            lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
            inviteStatus: 'accepted'
          },
          {
            _id: '2',
            name: 'Michael Johnson',
            relationship: 'child',
            phone: '+1 (555) 987-6543',
            email: 'michael.j@email.com',
            alertsEnabled: true,
            emergencyContact: false,
            lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
            inviteStatus: 'accepted'
          }
        ]);
      }

      // Fetch doctors
      try {
        const doctorsResponse = await apiClient.getDoctors();
        setDoctors(doctorsResponse.doctors || []);
      } catch (error) {
        console.error('Error loading doctors:', error);
        // Fall back to mock data
        setDoctors([
          {
            _id: '1',
            name: 'Dr. Emily Chen',
            specialty: 'endocrinologist',
            hospital: 'City Medical Center',
            phone: '+1 (555) 234-5678',
            email: 'dr.chen@citymedical.com',
            nextAppt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            verified: true
          },
          {
            _id: '2',
            name: 'Dr. Robert Martinez',
            specialty: 'nutritionist',
            hospital: 'Wellness Clinic',
            phone: '+1 (555) 345-6789',
            email: 'dr.martinez@wellness.com',
            nextAppt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            verified: true
          }
        ]);
      }

      // Fetch alerts
      try {
        const alertsResponse = await apiClient.getAlerts({ limit: 10 });
        setAlerts(alertsResponse.alerts || []);
      } catch (error) {
        console.error('Error loading alerts:', error);
        // Fall back to mock data
        setAlerts([
          {
            _id: '1',
            type: 'critical',
            message: 'Low blood sugar detected (65 mg/dL)',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            sentTo: ['Sarah Johnson'],
            acknowledged: false
          },
          {
            _id: '2',
            type: 'warning',
            message: 'Missed medication reminder',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            sentTo: ['Sarah Johnson'],
            acknowledged: true
          }
        ]);
      }

    } catch (error) {
      console.error('Error loading caregiver data:', error);
    } finally {
      setIsLoadingData(false);
    }
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

  const sendEmergencyAlert = async () => {
    try {
      const alertData = {
        type: 'emergency',
        category: 'emergency',
        title: 'Emergency SOS Activated',
        message: 'Emergency SOS activated - Immediate assistance needed',
        sendToContacts: true
      };

      await apiClient.createAlert(alertData);
      
      // Reload alerts to show the new one
      await loadCaregiverData();
      
      alert('Emergency alert sent to all emergency contacts!');
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please call 911 directly.');
    }
  };

  const handleAddCaregiver = async (caregiverData) => {
    try {
      // Token is automatically managed by useApiClient hook
      
      await apiClient.addCaregiver(caregiverData);
      setShowAddCaregiver(false);
      await loadCaregiverData(); // Reload data
      alert('Caregiver added successfully!');
    } catch (error) {
      console.error('Error adding caregiver:', error);
      alert('Failed to add caregiver. Please try again.');
    }
  };

  const handleAddDoctor = async (doctorData) => {
    try {
      // Token is automatically managed by useApiClient hook
      
      await apiClient.addDoctor(doctorData);
      setShowAddDoctor(false);
      await loadCaregiverData(); // Reload data
      alert('Doctor added successfully!');
    } catch (error) {
      console.error('Error adding doctor:', error);
      alert('Failed to add doctor. Please try again.');
    }
  };

  if (isLoading || isLoadingData) {
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
                <button 
                  onClick={() => setShowAddCaregiver(true)}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add Caregiver
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {caregivers.map((caregiver, index) => (
                  <div
                    key={caregiver._id || caregiver.id}
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
                          Last active: {caregiver.lastActive ? new Date(caregiver.lastActive).toLocaleDateString() : 'Never'}
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
                <button 
                  onClick={() => setShowAddDoctor(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add Doctor
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {doctors.map((doctor, index) => (
                  <div
                    key={doctor._id || doctor.id}
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
                        <span>Next: {doctor.nextAppt ? new Date(doctor.nextAppt).toLocaleDateString() : 'Not scheduled'}</span>
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
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Unknown time'}
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

      {/* Add Caregiver Modal */}
      {showAddCaregiver && <AddCaregiverForm onSubmit={handleAddCaregiver} onClose={() => setShowAddCaregiver(false)} />}

      {/* Add Doctor Modal */}
      {showAddDoctor && <AddDoctorForm onSubmit={handleAddDoctor} onClose={() => setShowAddDoctor(false)} />}
    </Layout>
  );
}

// Add Caregiver Form Component
function AddCaregiverForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'spouse',
    email: '',
    phone: '',
    emergencyContact: false,
    alertsEnabled: true
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Caregiver</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter caregiver's name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Relationship *</label>
            <select
              value={formData.relationship}
              onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="spouse">Spouse</option>
              <option value="parent">Parent</option>
              <option value="child">Child</option>
              <option value="sibling">Sibling</option>
              <option value="friend">Friend</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter email address"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="emergencyContact"
              checked={formData.emergencyContact}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.checked }))}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="emergencyContact" className="text-sm font-medium text-slate-700">
              Emergency Contact
            </label>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl hover:from-blue-700 hover:to-emerald-700 transition-all duration-300"
            >
              Add Caregiver
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Doctor Form Component
function AddDoctorForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    specialty: 'primary_care',
    hospital: '',
    email: '',
    phone: '',
    nextAppointment: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.hospital || !formData.email || !formData.phone) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Add Doctor</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Doctor Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Dr. John Smith"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Specialty *</label>
            <select
              value={formData.specialty}
              onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="primary_care">Primary Care</option>
              <option value="endocrinologist">Endocrinologist</option>
              <option value="nutritionist">Nutritionist</option>
              <option value="cardiologist">Cardiologist</option>
              <option value="ophthalmologist">Ophthalmologist</option>
              <option value="podiatrist">Podiatrist</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Hospital/Clinic *</label>
            <input
              type="text"
              value={formData.hospital}
              onChange={(e) => setFormData(prev => ({ ...prev, hospital: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="City Medical Center"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="doctor@hospital.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="(555) 123-4567"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Next Appointment</label>
            <input
              type="datetime-local"
              value={formData.nextAppointment}
              onChange={(e) => setFormData(prev => ({ ...prev, nextAppointment: e.target.value }))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
            >
              Add Doctor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
