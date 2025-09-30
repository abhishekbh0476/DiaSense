'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    diabetesType: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth || '',
        diabetesType: user.diabetesType || '',
        phone: user.phone || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would typically make an API call to update the user profile
      // await updateUserProfile(formData);
      console.log('Saving profile:', formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to original user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        dateOfBirth: user.dateOfBirth || '',
        diabetesType: user.diabetesType || '',
        phone: user.phone || '',
        emergencyContact: user.emergencyContact || '',
        emergencyPhone: user.emergencyPhone || ''
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your profile...</p>
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
                Profile Settings
              </h1>
              <p className="text-slate-600 mt-2 animate-slide-up animation-delay-100">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex space-x-3 animate-slide-in-right">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancel}
                    className="bg-slate-200 text-slate-700 px-6 py-2 rounded-xl font-medium hover:bg-slate-300 transition-all duration-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-blue-600 to-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-left animation-delay-200">
              <div className="text-center">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {user.fullName}
                </h3>
                <p className="text-slate-600 mb-4">{user.email}</p>
                <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300">
                  Change Photo
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 animate-slide-in-left animation-delay-400">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Member Since</span>
                  <span className="font-medium text-slate-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Glucose Readings</span>
                  <span className="font-medium text-slate-900">
                    {user.glucoseReadings?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Active Medications</span>
                  <span className="font-medium text-slate-900">
                    {user.medications?.filter(med => med.isActive).length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-right animation-delay-300">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Personal Information</h3>
              
              <form className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 enabled:text-slate-900 enabled:placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 enabled:text-slate-900 enabled:placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* Date of Birth and Diabetes Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 enabled:text-slate-900 enabled:placeholder-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Diabetes Type
                    </label>
                    <select
                      name="diabetesType"
                      value={formData.diabetesType}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 enabled:text-slate-900 enabled:placeholder-slate-400"
                    >
                      <option value="">Select diabetes type</option>
                      <option value="type1">Type 1 Diabetes</option>
                      <option value="type2">Type 2 Diabetes</option>
                      <option value="gestational">Gestational Diabetes</option>
                      <option value="prediabetes">Prediabetes</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="border-t border-slate-200 pt-6">
                  <h4 className="text-md font-semibold text-slate-900 mb-4">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Emergency contact name"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 enabled:text-slate-900 enabled:placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        placeholder="Emergency contact phone"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-slate-50 disabled:text-slate-500 enabled:text-slate-900 enabled:placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Security Section */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6 animate-slide-in-right animation-delay-500">
              <h3 className="text-lg font-semibold text-slate-900 mb-6">Security & Privacy</h3>
              <div className="space-y-4">
                <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                        Change Password
                      </h4>
                      <p className="text-sm text-slate-600">Update your account password</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
                
                <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                        Privacy Settings
                      </h4>
                      <p className="text-sm text-slate-600">Manage your data and privacy preferences</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button className="w-full text-left p-4 border border-slate-200 rounded-xl hover:border-red-300 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-slate-900 group-hover:text-red-600 transition-colors duration-300">
                        Delete Account
                      </h4>
                      <p className="text-sm text-slate-600">Permanently delete your account and data</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
