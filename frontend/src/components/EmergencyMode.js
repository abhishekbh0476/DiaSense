'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function EmergencyMode() {
  const { user } = useAuth();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emergencyType, setEmergencyType] = useState(null);
  const [location, setLocation] = useState(null);

  useEffect(() => {
    // Get user's location for emergency services
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0 && isEmergencyActive) {
      sendEmergencyAlert();
    }
    return () => clearInterval(interval);
  }, [countdown, isEmergencyActive]);

  const startEmergency = (type) => {
    setEmergencyType(type);
    setIsEmergencyActive(true);
    setCountdown(10); // 10 second countdown
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setCountdown(0);
    setEmergencyType(null);
  };

  const sendEmergencyAlert = async () => {
    const emergencyData = {
      userId: user?.id,
      userName: user?.fullName,
      emergencyType,
      timestamp: new Date().toISOString(),
      location: location ? {
        lat: location.latitude,
        lng: location.longitude,
        address: 'Getting address...' // In real app, reverse geocode
      } : null,
      currentGlucose: 65, // Mock current glucose reading
      lastReading: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      medications: user?.medications || [],
      emergencyContacts: [
        { name: 'Sarah Johnson', phone: '+1 (555) 123-4567', relationship: 'Spouse' },
        { name: 'Dr. Emily Chen', phone: '+1 (555) 234-5678', relationship: 'Doctor' }
      ]
    };

    try {
      // In real app, this would send to emergency services and contacts
      console.log('🚨 EMERGENCY ALERT SENT:', emergencyData);
      
      // Simulate sending alerts
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      alert(`Emergency alert sent successfully!\n\nContacts notified:\n- ${emergencyData.emergencyContacts.map(c => c.name).join('\n- ')}\n\nLocation: ${location ? 'Shared' : 'Not available'}\nCurrent glucose: ${emergencyData.currentGlucose} mg/dL`);
      
    } catch (error) {
      console.error('Failed to send emergency alert:', error);
      alert('Failed to send emergency alert. Please call 911 directly.');
    } finally {
      setIsEmergencyActive(false);
      setCountdown(0);
      setEmergencyType(null);
    }
  };

  if (!isEmergencyActive) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          {/* Emergency Button */}
          <button
            onClick={() => startEmergency('manual')}
            className="w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-full shadow-2xl hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-110 animate-pulse emergency-button"
            title="Emergency SOS"
          >
            <svg className="w-8 h-8 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-slate-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Emergency SOS
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
        {/* Emergency Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-to-r from-red-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-heartbeat">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Emergency Alert</h2>
          <p className="text-slate-600">
            Emergency services and your contacts will be notified in
          </p>
        </div>

        {/* Countdown */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-red-600 mb-2 animate-pulse">
            {countdown}
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-600 to-pink-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((10 - countdown) / 10) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Emergency Info */}
        <div className="bg-red-50 rounded-xl p-4 mb-6 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">Alert Details:</h3>
          <div className="space-y-1 text-sm text-red-800">
            <div>• Current glucose: 65 mg/dL (LOW)</div>
            <div>• Location: {location ? 'Will be shared' : 'Not available'}</div>
            <div>• Contacts: Sarah Johnson, Dr. Emily Chen</div>
            <div>• Medical info: Type 2 diabetes, current medications</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={cancelEmergency}
            className="flex-1 bg-slate-200 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-300 transition-all duration-300"
          >
            Cancel
          </button>
          <button
            onClick={sendEmergencyAlert}
            className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-700 hover:to-pink-700 transition-all duration-300 emergency-button"
          >
            Send Now
          </button>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-600 text-center mb-3">Quick Actions:</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => startEmergency('hypoglycemia')}
              className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-200 transition-all duration-300"
            >
              Low Blood Sugar
            </button>
            <button
              onClick={() => startEmergency('medical')}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all duration-300"
            >
              Medical Emergency
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
