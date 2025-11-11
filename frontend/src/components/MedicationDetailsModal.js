'use client';

import { useState } from 'react';

export default function MedicationDetailsModal({ medication, onClose, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);

  // Map medication type enum values to display labels
  const medicationTypeLabels = {
    'insulin': 'Insulin',
    'metformin': 'Metformin',
    'sulfonylurea': 'Sulfonylurea',
    'dpp4_inhibitor': 'DPP-4 Inhibitor',
    'sglt2_inhibitor': 'SGLT-2 Inhibitor',
    'glp1_agonist': 'GLP-1 Agonist',
    'other': 'Other'
  };

  // Calculate adherence rate if data is available
  const calculateAdherence = () => {
    if (!medication.adherenceData || medication.adherenceData.length === 0) {
      return 0;
    }
    const taken = medication.adherenceData.filter(d => d.taken).length;
    return Math.round((taken / medication.adherenceData.length) * 100);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (times) => {
    if (!times || times.length === 0) return 'Not specified';
    return times.map(time => {
      // Handle both { hour, minute } object format and 'HH:MM' string format
      let hours, minutes;
      
      if (typeof time === 'object' && time !== null) {
        // Format: { hour: 9, minute: 30 }
        hours = time.hour;
        minutes = time.minute;
      } else if (typeof time === 'string') {
        // Format: '09:30'
        const parts = time.split(':');
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
      } else {
        return 'Invalid time';
      }

      return new Date(0, 0, 0, hours, minutes).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }).join(', ');
  };

  const adherenceRate = calculateAdherence();
  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (isActive) => {
    return isActive ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{medication.name}</h2>
              <p className="text-gray-600 mt-1">{medicationTypeLabels[medication.type] || medication.type}</p>
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

          {/* Status Badge */}
          <div className={`p-4 rounded-xl mb-6 ${getStatusBg(medication.isActive)}`}>
            <p className={`font-medium ${getStatusColor(medication.isActive)}`}>
              {medication.isActive ? '✓ Currently Active' : '✗ Inactive'}
            </p>
          </div>

          <div className="space-y-6">
            {/* Dosage Information */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Dosage</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {medication.dosage?.amount || 'N/A'} <span className="text-lg text-gray-600">{medication.dosage?.unit || ''}</span>
                  </p>
                </div>
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Frequency</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {medication.frequency?.timesPerDay || 'N/A'} times per day
                  </p>
                </div>
              </div>
              {medication.frequency?.times && medication.frequency.times.length > 0 && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-2">Scheduled Times</p>
                  <p className="text-sm font-medium text-gray-900">{formatTime(medication.frequency.times)}</p>
                </div>
              )}
            </div>

            {/* Prescription Details */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Prescription Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prescribed By</span>
                  <span className="font-medium text-gray-900">{medication.prescribedBy || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date</span>
                  <span className="font-medium text-gray-900">{formatDate(medication.startDate)}</span>
                </div>
                {medication.endDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date</span>
                    <span className="font-medium text-gray-900">{formatDate(medication.endDate)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            {medication.instructions && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Instructions</h3>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <p className="text-gray-900">{medication.instructions}</p>
                </div>
              </div>
            )}

            {/* Side Effects */}
            {medication.sideEffects && medication.sideEffects.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Known Side Effects</h3>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <ul className="space-y-2">
                    {medication.sideEffects.map((effect, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        <span className="text-gray-900">{effect}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Reminders */}
            {medication.reminders?.enabled && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reminders</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-900">
                    ⏰ Reminder {medication.reminders.minutesBefore} minutes before each dose
                  </p>
                </div>
              </div>
            )}

            {/* Adherence */}
            {medication.adherenceData && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Adherence</h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">Overall Adherence Rate</span>
                    <span className="text-3xl font-bold text-green-600">{adherenceRate}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="border-t border-gray-200 pt-6 flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Close
              </button>
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(medication);
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Edit Medication
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
