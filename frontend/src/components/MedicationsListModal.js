'use client';

import { useState } from 'react';

export default function MedicationsListModal({ medications, onClose, onSelectMedication }) {
  const [sortBy, setSortBy] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');

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

  const getMedicationColor = (isActive) => {
    return isActive !== false ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50';
  };

  const getMedicationStatus = (isActive) => {
    return isActive !== false ? 'Active' : 'Inactive';
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
      let hours, minutes;
      
      if (typeof time === 'object' && time !== null) {
        hours = time.hour;
        minutes = time.minute;
      } else if (typeof time === 'string') {
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

  // Sort medications
  const sortedMedications = [...medications].sort((a, b) => {
    if (sortBy === 'active') {
      // Active first, then by name
      if ((a.isActive !== false) !== (b.isActive !== false)) {
        return (b.isActive !== false) ? 1 : -1;
      }
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    } else if (sortBy === 'newest') {
      return new Date(b.startDate) - new Date(a.startDate);
    } else if (sortBy === 'oldest') {
      return new Date(a.startDate) - new Date(b.startDate);
    }
    return 0;
  });

  // Filter medications
  const filteredMedications = sortedMedications.filter(medication => {
    const matchesSearch = medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (medicationTypeLabels[medication.type] || medication.type).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Your Medications</h2>
              <p className="text-gray-600">View and manage your medication list</p>
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

          {/* Search and Sort Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            {/* Search Box */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search medications by name or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active First</option>
                <option value="name">Name (A-Z)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>

            {/* Count */}
            <div className="text-sm text-gray-600 flex items-center whitespace-nowrap">
              Showing {filteredMedications.length} of {medications.length} medications
            </div>
          </div>

          {/* Medications List */}
          <div className="space-y-3">
            {filteredMedications.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <p className="text-gray-500 font-medium">No medications found</p>
                <p className="text-sm text-gray-400">
                  {searchTerm ? 'Try adjusting your search term' : 'Start adding medications to your profile'}
                </p>
              </div>
            ) : (
              filteredMedications.map((medication, index) => (
                <button
                  key={medication._id || index}
                  onClick={() => onSelectMedication(medication)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    {/* Left Side - Medication Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        {/* Medication Status Indicator */}
                        <div className={`px-3 py-2 rounded-lg font-semibold text-sm ${getMedicationColor(medication.isActive)}`}>
                          {getMedicationStatus(medication.isActive)}
                        </div>

                        {/* Medication Name and Type */}
                        <div>
                          <p className="font-bold text-gray-900 text-lg group-hover:text-emerald-600 transition-colors">
                            {medication.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {medicationTypeLabels[medication.type] || medication.type}
                          </p>
                        </div>
                      </div>

                      {/* Dosage and Frequency Info */}
                      <div className="mt-3 ml-12 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-600">Dosage:</span>
                          <span className="font-medium text-gray-900">
                            {medication.dosage?.amount} {medication.dosage?.unit}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-gray-600">Frequency:</span>
                          <span className="font-medium text-gray-900">
                            {medication.frequency?.timesPerDay}x per day
                          </span>
                        </div>
                        {medication.frequency?.times && medication.frequency.times.length > 0 && (
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-600">Times:</span>
                            <span className="font-medium text-gray-900">
                              {formatTime(medication.frequency.times)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Prescription Dates */}
                      <div className="mt-2 ml-12 flex flex-wrap gap-4 text-xs text-gray-600">
                        <span>Started: {formatDate(medication.startDate)}</span>
                        {medication.endDate && <span>Ends: {formatDate(medication.endDate)}</span>}
                        {medication.prescribedBy && <span>Dr. {medication.prescribedBy}</span>}
                      </div>
                    </div>

                    {/* Right Side - Click Indicator */}
                    <div className="ml-4 text-gray-400 group-hover:text-emerald-600 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Instructions or Side Effects - shown as preview */}
                  {(medication.instructions || medication.sideEffects?.length > 0) && (
                    <div className="mt-3 ml-12 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      {medication.instructions && (
                        <p className="text-xs text-amber-900">
                          <span className="font-semibold">Instructions:</span> {medication.instructions.substring(0, 60)}
                          {medication.instructions.length > 60 ? '...' : ''}
                        </p>
                      )}
                      {medication.sideEffects?.length > 0 && (
                        <p className="text-xs text-amber-900 mt-1">
                          <span className="font-semibold">Side Effects:</span> {medication.sideEffects.slice(0, 2).join(', ')}
                          {medication.sideEffects.length > 2 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              ))
            )}
          </div>

          {/* Summary Stats */}
          {medications.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-emerald-50 rounded-xl">
              <div className="text-center">
                <p className="text-sm text-emerald-600 font-medium">Total Medications</p>
                <p className="text-2xl font-bold text-emerald-900">{medications.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {medications.filter(m => m.isActive !== false).length}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medications.filter(m => m.isActive === false).length}
                </p>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
