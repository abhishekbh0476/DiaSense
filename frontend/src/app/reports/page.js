'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import { createReportPayload } from '../../lib/pdfGenerator';
import { formatDate } from '../../lib/formatDate';

export default function Reports() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [reportType, setReportType] = useState('comprehensive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);
  const [error, setError] = useState(null);
  const [glucoseData, setGlucoseData] = useState(null);
  const [medicationData, setMedicationData] = useState(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadReportData();
      loadReportHistory();
    }
  }, [isAuthenticated]);

  const loadReportData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch glucose data
      const glucoseRes = await fetch('/api/glucose', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (glucoseRes.ok) {
        const data = await glucoseRes.json();
        setGlucoseData(data);
      }
      
      // Fetch medication data
      const medRes = await fetch('/api/medications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (medRes.ok) {
        const data = await medRes.json();
        setMedicationData(data.medications || []);
      }
    } catch (err) {
      console.error('Error loading report data:', err);
    }
  };

  const loadReportHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setGeneratedReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error loading report history:', err);
      // Fall back to mock data if API fails
      setGeneratedReports([]);
    }
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const reportPayload = createReportPayload(
        reportType,
        glucoseData,
        medicationData,
        getPeriodLabel(),
        user
      );
      
      // Generate and download PDF
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportPayload)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate PDF');
      }
      
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportPayload.fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Add to report history
      const newReport = {
        id: Date.now(),
        title: getReportTitle(),
        period: getPeriodLabel(),
        type: reportType,
        generatedAt: new Date(),
        size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
        pages: Math.ceil(blob.size / 5000), // Estimate
        sharedWith: []
      };
      
      setGeneratedReports(prev => [newReport, ...prev]);
      
      // Show success message
      alert(`${newReport.title} generated and downloaded successfully!`);
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message || 'Failed to generate report');
      alert(`Error: ${err.message || 'Failed to generate report'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const getReportTitle = () => {
    const titles = {
      comprehensive: 'Comprehensive Health Report',
      glucose: 'Glucose Monitoring Report',
      medication: 'Medication Adherence Report',
      lifestyle: 'Lifestyle & Activity Report'
    };
    return titles[reportType] || 'Health Report';
  };

  const getPeriodLabel = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return `${formatDate(weekStart)} - ${formatDate(now)}`;
      case 'month':
        return formatDate(now, { month: 'long', year: 'numeric' });
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        return `Q${quarter} ${now.getFullYear()}`;
      case 'year':
        return now.getFullYear().toString();
      default:
        return 'Custom Period';
    }
  };

  const shareReport = (reportId) => {
    alert('Report sharing feature coming soon! You can download and share the PDF directly.');
  };

  const downloadReport = async (reportId) => {
    try {
      const token = localStorage.getItem('token');
      const report = generatedReports.find(r => r.id === reportId);
      
      if (!report) {
        alert('Report not found');
        return;
      }
      
      // Create report payload for download
      const reportPayload = createReportPayload(
        report.type,
        glucoseData,
        medicationData,
        report.period,
        user
      );
      
      // Generate PDF
      const response = await fetch('/api/reports/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reportPayload)
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      // Trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.title}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Failed to download report');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading reports...</p>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
            Medical Reports
          </h1>
          <p className="text-slate-600 mt-2 animate-slide-up animation-delay-100">
            Generate and share comprehensive health reports with your healthcare team
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Generator */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-left animation-delay-200 sticky top-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Generate New Report</h2>
              
              {/* Report Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Report Type</label>
                <div className="space-y-2">
                  {[
                    { id: 'comprehensive', label: 'Comprehensive', desc: 'All health data', icon: '📊' },
                    { id: 'glucose', label: 'Glucose Only', desc: 'Blood sugar trends', icon: '🩸' },
                    { id: 'medication', label: 'Medication', desc: 'Adherence & timing', icon: '💊' },
                    { id: 'lifestyle', label: 'Lifestyle', desc: 'Diet & exercise', icon: '🏃‍♂️' }
                  ].map((type) => (
                    <label
                      key={type.id}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        reportType === type.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportType"
                        value={type.id}
                        checked={reportType === type.id}
                        onChange={(e) => setReportType(e.target.value)}
                        className="sr-only"
                      />
                      <span className="text-2xl mr-3">{type.icon}</span>
                      <div>
                        <div className="font-medium text-slate-900">{type.label}</div>
                        <div className="text-sm text-slate-600">{type.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Period Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-3">Time Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900"
                >
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">Last Year</option>
                </select>
              </div>

              {/* Preview Info */}
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <h3 className="font-medium text-slate-900 mb-2">Report Preview</h3>
                <div className="space-y-1 text-sm text-slate-600">
                  <div>Type: {getReportTitle()}</div>
                  <div>Period: {getPeriodLabel()}</div>
                  <div>Format: PDF</div>
                  <div>Estimated pages: 8-12</div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateReport}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Generate Report</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Report History */}
          <div className="lg:col-span-2">
            <div className="animate-slide-in-right animation-delay-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Report History</h2>
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{generatedReports.length} reports generated</span>
                </div>
              </div>

              <div className="space-y-4">
                {generatedReports.map((report, index) => (
                  <div
                    key={`${report.id || index}-${report.generatedAt}`}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        {/* Report Icon */}
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        
                        {/* Report Details */}
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{report.title}</h3>
                          <p className="text-slate-600 text-sm mb-2">{typeof report.period === 'object' ? report.period.label : report.period}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-slate-500 mb-3">
                            <span>{report.size}</span>
                            <span>•</span>
                            <span>{report.pages} pages</span>
                            <span>•</span>
                            <span>Generated {formatDate(report.generatedAt)}</span>
                          </div>
                          
                          {/* Shared With */}
                          {report.sharedWith.length > 0 && (
                            <div className="flex items-center space-x-2 mb-3">
                              <span className="text-xs text-slate-500">Shared with:</span>
                              <div className="flex flex-wrap gap-1">
                                {report.sharedWith.map((person, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium"
                                  >
                                    {person}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex flex-col space-y-2 ml-4">
                        <button
                          onClick={() => downloadReport(report.id)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all duration-300 transform hover:scale-110"
                          title="Download PDF"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => shareReport(report.id)}
                          className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-all duration-300 transform hover:scale-110"
                          title="Share Report"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Empty State */}
              {generatedReports.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Reports Generated</h3>
                  <p className="text-slate-600 mb-6">
                    Generate your first medical report to share with healthcare providers
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Report Templates Info */}
        <div className="mt-12 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-2xl p-8 border border-blue-200 animate-slide-up animation-delay-500">
          <h3 className="text-xl font-semibold text-slate-900 mb-4 text-center">What&apos;s Included in Your Reports</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Glucose Trends</h4>
              <p className="text-slate-600 text-sm">Detailed charts and statistics of your blood sugar patterns</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Medication Log</h4>
              <p className="text-slate-600 text-sm">Adherence rates, timing analysis, and dosage tracking</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">AI Insights</h4>
              <p className="text-slate-600 text-sm">Personalized recommendations and pattern analysis</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-slate-900 mb-2">Lifestyle Data</h4>
              <p className="text-slate-600 text-sm">Exercise, diet, sleep, and stress level correlations</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
