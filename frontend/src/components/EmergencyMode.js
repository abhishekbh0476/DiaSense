'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useApiClient } from '../hooks/useApiClient';

export default function EmergencyMode() {
  const { user } = useAuth();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emergencyType, setEmergencyType] = useState(null);
  const [location, setLocation] = useState(null);
  const apiClient = useApiClient();
  const [contacts, setContacts] = useState([]);
  const [smsResults, setSmsResults] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);

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

  // Load emergency contacts when modal opens
  useEffect(() => {
    let cancelled = false;
    const loadContacts = async () => {
      if (!isEmergencyActive) return;
      setLoadingContacts(true);
      try {
        const resp = await apiClient.getCaregivers();
        let found = (resp.caregivers || []).filter(c => c.emergencyContact && c.alertsEnabled).map(c => ({ name: c.name, phone: c.phone }));
        if (!found.length && user?.emergencyContacts) {
          found = user.emergencyContacts.map(c => ({ name: c.name || c.label || 'Contact', phone: c.phone }));
        }
        if (!cancelled) setContacts(found);
      } catch (err) {
        console.warn('Failed to load caregivers for emergency modal', err);
        if (!cancelled && user?.emergencyContacts) {
          setContacts(user.emergencyContacts.map(c => ({ name: c.name || c.label || 'Contact', phone: c.phone })));
        }
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    };

    loadContacts();
    return () => { cancelled = true; };
  }, [isEmergencyActive, apiClient, user]);

  const sendEmergencyAlert = useCallback(async () => {
    setSending(true);
    try {
      // Use currently-loaded contacts (if any) or fetch fresh
      let useContacts = contacts && contacts.length ? contacts : [];
      if (!useContacts.length) {
        try {
          const resp = await apiClient.getCaregivers();
          useContacts = (resp.caregivers || []).filter(c => c.emergencyContact && c.alertsEnabled).map(c => ({ name: c.name, phone: c.phone }));
        } catch (err) {
          console.warn('Failed to load caregivers before sending', err);
        }
      }

      if (!useContacts.length && user?.emergencyContacts) {
        useContacts = user.emergencyContacts;
      }

      const alertPayload = {
        type: 'emergency',
        category: 'glucose',
        title: 'Emergency SOS Activated',
        message: `${user?.firstName || 'User'} may need assistance: ${emergencyType || 'emergency'}`,
        data: {
          location: location ? { lat: location.latitude, lng: location.longitude } : null,
          currentGlucose: user?.lastGlucose || null,
        },
        sendToContacts: true
      };

      // call backend to create alert and trigger notifications
      const createResp = await apiClient.createAlert(alertPayload);
      console.log('Emergency alert created:', createResp);

      // server should return the saved alert; try to extract smsResults
      const returnedAlert = createResp.alert || createResp.data || null;
      const results = returnedAlert?.smsResults || null;
      setSmsResults(results);

      // Show a user-friendly message depending on results
      if (results && results.length) {
        alert(`Emergency SMS sent to ${results.length} contact(s).`);
      } else {
        // No sms results - explain possible reasons using server-provided flag
        let reason = 'No SMS were sent.';
        const twilioConfigured = typeof createResp.twilioConfigured !== 'undefined' ? createResp.twilioConfigured : null;
        if (twilioConfigured === false) {
          reason += ' Twilio is not configured on the server.';
        } else if (!useContacts.length) {
          reason += ' No emergency contacts with valid phone numbers were found.';
        } else if (twilioConfigured === null) {
          reason += ' Server did not report Twilio status; check server logs.';
        } else {
          reason += ' Check server logs for details (possible invalid numbers or sending errors).';
        }
        alert(`Emergency alert created but ${reason}`);
      }
    } catch (error) {
      console.error('Error sending emergency alert:', error);
      alert('Failed to send emergency alert. Please call emergency services directly.');
    } finally {
      setSending(false);
      setIsEmergencyActive(false);
      setCountdown(0);
      setEmergencyType(null);
    }
  }, [user, location, emergencyType, apiClient, contacts]);

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
  }, [countdown, isEmergencyActive, sendEmergencyAlert]);

  const startEmergency = (type) => {
    setEmergencyType(type);
    setIsEmergencyActive(true);
    setCountdown(10);
  };

  const cancelEmergency = () => {
    setIsEmergencyActive(false);
    setCountdown(0);
    setEmergencyType(null);
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
            <div>• Current glucose: {user?.lastGlucose ?? 'Unknown'}</div>
            <div>• Location: {location ? 'Will be shared' : 'Not available'}</div>
            <div>
              • Contacts: {loadingContacts ? 'Loading...' : (
                contacts && contacts.length ? (
                  <ul className="list-none pl-0">
                    {contacts.map((c, idx) => (
                      <li key={idx} className="truncate">{c.name || c.label || 'Contact'} — {c.phone || 'No number'}</li>
                    ))}
                  </ul>
                ) : 'No emergency contacts found'
              )}
            </div>
            <div>• Medical info: {user?.medicalInfo || 'Not provided'}</div>
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
        {/* SMS Results (if any) */}
        {smsResults && smsResults.length > 0 && (
          <div className="mt-4 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <h4 className="text-sm font-semibold mb-2">SMS Send Results</h4>
            <div className="space-y-2 text-sm text-slate-700">
              {smsResults.map((r, i) => (
                <div key={i} className="flex justify-between items-start">
                  <div className="truncate">
                    <div className="font-medium">{r.toName || r.to || 'Recipient'}</div>
                    <div className="text-xs text-slate-500">{r.toPhone || r.to || ''}</div>
                  </div>
                  <div className="ml-4 text-right">
                    {r.success ? (
                      <div className="text-green-600 font-semibold">Sent</div>
                    ) : (
                      <div className="text-red-600 font-medium">Failed</div>
                    )}
                    {r.error && <div className="text-xs text-red-500">{r.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
