'use client';

import { useState, useEffect } from 'react';
import { useApiClient } from '../hooks/useApiClient';

export default function ReportsModal({ onClose }) {
  const apiClient = useApiClient();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getReports();
      setReports(response.reports || []);
    } catch (error) {
      console.error('Error loading reports:', error);
      // Fall back to mock data
      setReports([
        {
          _id: '1',
          title: 'Weekly Glucose Summary',
          type: 'glucose',
          period: 'weekly',
          generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          data: {
            averageGlucose: 125,
            timeInRange: 78,
            totalReadings: 42,
            lowReadings: 3,
            highReadings: 6
          }
        },
        {
          _id: '2',
          title: 'Monthly Medication Adherence',
          type: 'medication',
          period: 'monthly',
          generatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          data: {
            adherenceRate: 92,
            missedDoses: 5,
            totalDoses: 62,
            medications: ['Metformin', 'Insulin']
          }
        },
        {
          _id: '3',
          title: 'Comprehensive Health Report',
          type: 'comprehensive',
          period: 'monthly',
          generatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          data: {
            glucoseStats: { average: 128, timeInRange: 75 },
            medicationStats: { adherenceRate: 89 },
            alertsCount: 12,
            doctorVisits: 2
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNewReport = async (type, period) => {
    try {
      setIsGenerating(true);
      await apiClient.generateReport({ type, periodType: period });
      await loadReports();
      alert('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareReport = async (reportId) => {
    try {
      await apiClient.shareReport(reportId, { shareWith: 'doctor' });
      alert('Report shared successfully with your healthcare provider!');
    } catch (error) {
      console.error('Error sharing report:', error);
      alert('Failed to share report. Please try again.');
    }
  };

  const getReportIcon = (type) => {
    switch (type) {
      case 'glucose':
        return (
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'medication':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  if (selectedReport) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-full py-8 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedReport.title}</h2>
                <p className="text-gray-600">
                  Generated on {selectedReport.generatedAt ? new Date(selectedReport.generatedAt).toLocaleDateString() : 'Unknown date'}
                </p>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Report Content */}
            <div className="space-y-6">
              {selectedReport.type === 'glucose' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-blue-600">Average Glucose</h3>
                    <p className="text-2xl font-bold text-blue-900">{selectedReport.data.averageGlucose} mg/dL</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-green-600">Time in Range</h3>
                    <p className="text-2xl font-bold text-green-900">{selectedReport.data.timeInRange}%</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-purple-600">Total Readings</h3>
                    <p className="text-2xl font-bold text-purple-900">{selectedReport.data.totalReadings}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-orange-600">Out of Range</h3>
                    <p className="text-2xl font-bold text-orange-900">
                      {selectedReport.data.lowReadings + selectedReport.data.highReadings}
                    </p>
                  </div>
                </div>
              )}

              {selectedReport.type === 'medication' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-green-600">Adherence Rate</h3>
                      <p className="text-2xl font-bold text-green-900">{selectedReport.data.adherenceRate}%</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-red-600">Missed Doses</h3>
                      <p className="text-2xl font-bold text-red-900">{selectedReport.data.missedDoses}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-blue-600">Total Doses</h3>
                      <p className="text-2xl font-bold text-blue-900">{selectedReport.data.totalDoses}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Medications Tracked</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.data.medications.map((med, index) => (
                        <span key={index} className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700">
                          {med}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedReport.type === 'comprehensive' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded-xl">
                      <h3 className="text-lg font-semibold text-blue-900 mb-3">Glucose Management</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Average:</span>
                          <span className="font-medium">{selectedReport.data.glucoseStats.average} mg/dL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Time in Range:</span>
                          <span className="font-medium">{selectedReport.data.glucoseStats.timeInRange}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <h3 className="text-lg font-semibold text-green-900 mb-3">Medication Adherence</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-green-700">Adherence Rate:</span>
                          <span className="font-medium">{selectedReport.data.medicationStats.adherenceRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-orange-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-orange-600">Alerts Generated</h3>
                      <p className="text-2xl font-bold text-orange-900">{selectedReport.data.alertsCount}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-xl">
                      <h3 className="text-sm font-medium text-purple-600">Doctor Visits</h3>
                      <p className="text-2xl font-bold text-purple-900">{selectedReport.data.doctorVisits}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => shareReport(selectedReport._id)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Share with Doctor
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
              >
                Back to Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Health Reports</h2>
              <p className="text-gray-600">View and generate your health reports</p>
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

          {/* Generate New Report */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate New Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => generateNewReport('glucose', 'week')}
                disabled={isGenerating}
                className="p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors duration-200 disabled:opacity-50"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    {getReportIcon('glucose')}
                  </div>
                  <p className="font-medium text-gray-900">Glucose Report</p>
                  <p className="text-sm text-gray-600">Weekly summary</p>
                </div>
              </button>
              
              <button
                onClick={() => generateNewReport('medication', 'month')}
                disabled={isGenerating}
                className="p-4 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors duration-200 disabled:opacity-50"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    {getReportIcon('medication')}
                  </div>
                  <p className="font-medium text-gray-900">Medication Report</p>
                  <p className="text-sm text-gray-600">Monthly adherence</p>
                </div>
              </button>
              
              <button
                onClick={() => generateNewReport('comprehensive', 'month')}
                disabled={isGenerating}
                className="p-4 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors duration-200 disabled:opacity-50"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    {getReportIcon('comprehensive')}
                  </div>
                  <p className="font-medium text-gray-900">Comprehensive</p>
                  <p className="text-sm text-gray-600">Full health report</p>
                </div>
              </button>
            </div>
          </div>

          {/* Existing Reports */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No reports generated yet</p>
                <p className="text-sm text-gray-400">Generate your first report using the options above</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {getReportIcon(report.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{report.title}</h4>
                        <p className="text-sm text-gray-600">
                          Generated {report.generatedAt ? new Date(report.generatedAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                        {report.period}
                      </span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
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
