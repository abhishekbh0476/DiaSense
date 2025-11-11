'use client';

import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiClient } from '../hooks/useApiClient';

export default function SettingsModal({ user, onClose }) {
  const { logout } = useAuth();
  const apiClient = useApiClient();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    diabetesType: user?.diabetesType || 'type2',
    diagnosisDate: user?.diagnosisDate ? new Date(user.diagnosisDate).toISOString().split('T')[0] : ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    medicationReminders: true,
    glucoseAlerts: true,
    appointmentReminders: true,
    weeklyReports: true,
    communityUpdates: false,
    emailNotifications: true,
    pushNotifications: true
  });

  const [glucoseTargets, setGlucoseTargets] = useState({
    targetMin: 70,
    targetMax: 180,
    criticalLow: 54,
    criticalHigh: 250,
    units: 'mg/dL'
  });

  const [privacySettings, setPrivacySettings] = useState({
    shareDataWithDoctors: true,
    shareDataWithCaregivers: true,
    allowCommunityInteraction: true,
    dataRetentionPeriod: '2years',
    anonymousAnalytics: true
  });

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      await apiClient.updateProfile(profileData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async (settingsType, data) => {
    try {
      setIsSaving(true);
      // In a real app, you'd have separate endpoints for different settings
      await apiClient.updateProfile({ [settingsType]: data });
      alert('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to log out?')) {
      await logout();
      onClose();
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'glucose', name: 'Glucose Targets', icon: '🩸' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'account', name: 'Account', icon: '⚙️' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar */}
            <div className="md:w-1/4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 flex items-center space-x-3 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="md:w-3/4">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={profileData.dateOfBirth}
                        onChange={(e) => setProfileData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diabetes Type</label>
                      <select
                        value={profileData.diabetesType}
                        onChange={(e) => setProfileData(prev => ({ ...prev, diabetesType: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="type1">Type 1</option>
                        <option value="type2">Type 2</option>
                        <option value="gestational">Gestational</option>
                        <option value="prediabetes">Prediabetes</option>
                      </select>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(notificationSettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {key === 'medicationReminders' && 'Get reminded to take your medications'}
                            {key === 'glucoseAlerts' && 'Receive alerts for abnormal glucose levels'}
                            {key === 'appointmentReminders' && 'Reminders for upcoming appointments'}
                            {key === 'weeklyReports' && 'Weekly health summary reports'}
                            {key === 'communityUpdates' && 'Updates from community groups and events'}
                            {key === 'emailNotifications' && 'Receive notifications via email'}
                            {key === 'pushNotifications' && 'Receive push notifications on your device'}
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleSaveSettings('notificationSettings', notificationSettings)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Notifications'}
                  </button>
                </div>
              )}

              {/* Glucose Targets Tab */}
              {activeTab === 'glucose' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Glucose Target Ranges</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Range Min</label>
                      <input
                        type="number"
                        value={glucoseTargets.targetMin}
                        onChange={(e) => setGlucoseTargets(prev => ({ ...prev, targetMin: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Target Range Max</label>
                      <input
                        type="number"
                        value={glucoseTargets.targetMax}
                        onChange={(e) => setGlucoseTargets(prev => ({ ...prev, targetMax: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Critical Low Alert</label>
                      <input
                        type="number"
                        value={glucoseTargets.criticalLow}
                        onChange={(e) => setGlucoseTargets(prev => ({ ...prev, criticalLow: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Critical High Alert</label>
                      <input
                        type="number"
                        value={glucoseTargets.criticalHigh}
                        onChange={(e) => setGlucoseTargets(prev => ({ ...prev, criticalHigh: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-medium text-blue-900 mb-2">Current Targets</h4>
                    <p className="text-sm text-blue-700">
                      Target Range: {glucoseTargets.targetMin} - {glucoseTargets.targetMax} {glucoseTargets.units}
                    </p>
                    <p className="text-sm text-blue-700">
                      Critical Alerts: Below {glucoseTargets.criticalLow} or Above {glucoseTargets.criticalHigh} {glucoseTargets.units}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => handleSaveSettings('glucoseTargets', glucoseTargets)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Targets'}
                  </button>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Privacy & Data</h3>
                  
                  <div className="space-y-4">
                    {Object.entries(privacySettings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {key === 'shareDataWithDoctors' && 'Allow doctors to access your health data'}
                            {key === 'shareDataWithCaregivers' && 'Allow caregivers to view your information'}
                            {key === 'allowCommunityInteraction' && 'Participate in community features'}
                            {key === 'dataRetentionPeriod' && 'How long to keep your data'}
                            {key === 'anonymousAnalytics' && 'Help improve the app with anonymous usage data'}
                          </p>
                        </div>
                        {key === 'dataRetentionPeriod' ? (
                          <select
                            value={value}
                            onChange={(e) => setPrivacySettings(prev => ({ ...prev, [key]: e.target.value }))}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="1year">1 Year</option>
                            <option value="2years">2 Years</option>
                            <option value="5years">5 Years</option>
                            <option value="indefinite">Indefinite</option>
                          </select>
                        ) : (
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setPrivacySettings(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => handleSaveSettings('privacySettings', privacySettings)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">Account Management</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <h4 className="font-medium text-yellow-900 mb-2">Change Password</h4>
                      <p className="text-sm text-yellow-700 mb-3">
                        Update your password to keep your account secure
                      </p>
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200">
                        Change Password
                      </button>
                    </div>
                    
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Export Data</h4>
                      <p className="text-sm text-blue-700 mb-3">
                        Download a copy of all your health data
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                        Export Data
                      </button>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                      <h4 className="font-medium text-red-900 mb-2">Sign Out</h4>
                      <p className="text-sm text-red-700 mb-3">
                        Sign out of your account on this device
                      </p>
                      <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                      >
                        Sign Out
                      </button>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2">Delete Account</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Permanently delete your account and all data
                      </p>
                      <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
