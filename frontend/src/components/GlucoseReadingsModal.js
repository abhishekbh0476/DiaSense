'use client';

import { useState } from 'react';

export default function GlucoseReadingsModal({ readings, onClose }) {
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');

  const getGlucoseColor = (value) => {
    if (value < 70) return 'text-red-600 bg-red-50';
    if (value > 180) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getGlucoseStatus = (value) => {
    if (value < 70) return 'Low';
    if (value > 180) return 'High';
    return 'Normal';
  };

  const sortedReadings = [...readings].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else if (sortBy === 'oldest') {
      return new Date(a.timestamp) - new Date(b.timestamp);
    } else if (sortBy === 'highest') {
      return b.value - a.value;
    } else if (sortBy === 'lowest') {
      return a.value - b.value;
    }
    return 0;
  });

  const filteredReadings = sortedReadings.filter(reading => {
    if (filterBy === 'all') return true;
    if (filterBy === 'low') return reading.value < 70;
    if (filterBy === 'normal') return reading.value >= 70 && reading.value <= 180;
    if (filterBy === 'high') return reading.value > 180;
    return true;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Glucose Readings</h2>
              <p className="text-gray-600">View and analyze your glucose history</p>
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

          {/* Filters and Sort */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="highest">Highest Value</option>
                <option value="lowest">Lowest Value</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Readings</option>
                <option value="low">Low (&lt;70)</option>
                <option value="normal">Normal (70-180)</option>
                <option value="high">High (&gt;180)</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              Showing {filteredReadings.length} of {readings.length} readings
            </div>
          </div>

          {/* Readings List */}
          <div className="space-y-3">
            {filteredReadings.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-gray-500">No glucose readings found</p>
                <p className="text-sm text-gray-400">Start logging your glucose levels to see them here</p>
              </div>
            ) : (
              filteredReadings.map((reading, index) => (
                <div key={reading._id || index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getGlucoseColor(reading.value)}`}>
                        {reading.value} mg/dL
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {reading.timestamp ? new Date(reading.timestamp).toLocaleDateString() : 'Unknown date'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : 'Unknown time'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getGlucoseColor(reading.value)}`}>
                        {getGlucoseStatus(reading.value)}
                      </div>
                      {reading.mealContext && (
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {reading.mealContext.replace('_', ' ')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {reading.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Notes:</span> {reading.notes}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Summary Stats */}
          {filteredReadings.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-xl">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium">Average</p>
                <p className="text-lg font-bold text-blue-900">
                  {Math.round(filteredReadings.reduce((sum, r) => sum + r.value, 0) / filteredReadings.length)} mg/dL
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-green-600 font-medium">Lowest</p>
                <p className="text-lg font-bold text-green-900">
                  {Math.min(...filteredReadings.map(r => r.value))} mg/dL
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-red-600 font-medium">Highest</p>
                <p className="text-lg font-bold text-red-900">
                  {Math.max(...filteredReadings.map(r => r.value))} mg/dL
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-purple-600 font-medium">In Range</p>
                <p className="text-lg font-bold text-purple-900">
                  {Math.round((filteredReadings.filter(r => r.value >= 70 && r.value <= 180).length / filteredReadings.length) * 100)}%
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
