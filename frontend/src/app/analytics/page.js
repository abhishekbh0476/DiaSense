'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';
import apiClient from '../../lib/api';

export default function Analytics() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('glucose');
  const [glucoseData, setGlucoseData] = useState({ readings: [], stats: {} });
  const [medications, setMedications] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAnalyticsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoadingData(true);
      
      // Set the API token
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.setToken(token);
      }

      // Convert timeRange to days
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;

      // Fetch glucose data
      const glucoseResponse = await apiClient.getGlucoseReadings({ days, limit: 100 });
      setGlucoseData(glucoseResponse);

      // Fetch medications
      const medicationsResponse = await apiClient.getMedications(true);
      setMedications(medicationsResponse.medications || []);

    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Fall back to mock data
      setGlucoseData({
        readings: generateMockReadings(),
        stats: {
          average: 110,
          timeInRange: 75,
          lowReadings: 8,
          highReadings: 12,
          count: 156
        }
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const generateMockReadings = () => {
    const readings = [];
    const now = new Date();
    for (let i = 0; i < 20; i++) {
      const timestamp = new Date(now.getTime() - i * 6 * 60 * 60 * 1000); // Every 6 hours
      const value = 80 + Math.random() * 80; // Random between 80-160
      readings.push({
        _id: i.toString(),
        value: Math.round(value),
        timestamp,
        status: value < 70 ? 'low' : value > 140 ? 'high' : 'normal'
      });
    }
    return readings;
  };

  if (isLoading || isLoadingData) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading your analytics...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Mock data for demonstration
  const mockGlucoseData = [
    { time: '6:00', value: 95, status: 'normal' },
    { time: '9:00', value: 140, status: 'high' },
    { time: '12:00', value: 110, status: 'normal' },
    { time: '15:00', value: 85, status: 'low' },
    { time: '18:00', value: 125, status: 'normal' },
    { time: '21:00', value: 105, status: 'normal' },
  ];

  const mockStats = {
    avgGlucose: 110,
    timeInRange: 75,
    lowReadings: 8,
    highReadings: 12,
    totalReadings: 156
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
                Analytics Dashboard
              </h1>
              <p className="text-slate-600 mt-2 animate-slide-up animation-delay-100">
                Track your glucose trends and health insights
              </p>
            </div>
            
            {/* Time Range Selector */}
            <div className="mt-4 sm:mt-0 animate-slide-in-right">
              <div className="flex bg-slate-100 rounded-xl p-1">
                {[
                  { value: '7d', label: '7 Days' },
                  { value: '30d', label: '30 Days' },
                  { value: '90d', label: '90 Days' },
                  { value: '1y', label: '1 Year' }
                ].map((range) => (
                  <button
                    key={range.value}
                    onClick={() => setTimeRange(range.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      timeRange === range.value
                        ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-lg'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animation-delay-200 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                <svg className="w-6 h-6 text-blue-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Avg Glucose</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-300">
                  {Math.round(glucoseData.stats.average || 0)} <span className="text-sm font-normal text-slate-500">mg/dL</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animation-delay-300 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-xl group-hover:from-emerald-200 group-hover:to-emerald-300 transition-all duration-300">
                <svg className="w-6 h-6 text-emerald-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Time in Range</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">
                  {glucoseData.stats.timeInRange || 0}<span className="text-sm font-normal text-slate-500">%</span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animation-delay-400 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                <svg className="w-6 h-6 text-orange-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">High Readings</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors duration-300">
                  {glucoseData.stats.highReadings || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-up animation-delay-500 hover:shadow-xl transition-all duration-300 transform hover:scale-105 group">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-r from-red-100 to-red-200 rounded-xl group-hover:from-red-200 group-hover:to-red-300 transition-all duration-300">
                <svg className="w-6 h-6 text-red-600 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600">Low Readings</p>
                <p className="text-2xl font-bold text-slate-900 group-hover:text-red-600 transition-colors duration-300">
                  {glucoseData.stats.lowReadings || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-left animation-delay-600">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Glucose Trends</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedMetric('glucose')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedMetric === 'glucose'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Glucose
                  </button>
                  <button
                    onClick={() => setSelectedMetric('medication')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-300 ${
                      selectedMetric === 'medication'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Medication
                  </button>
                </div>
              </div>

              {/* Real Data Chart */}
              {selectedMetric === 'glucose' ? (
                <>
                  <div className="h-80 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 relative">
                    {glucoseData.readings.length > 0 ? (
                      <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <defs>
                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>
                        
                        {/* Y-axis grid lines and labels */}
                        {[0, 50, 100, 150, 200, 250].map((gridVal) => (
                          <g key={`grid-${gridVal}`}>
                            <line x1="0" y1={300 - (gridVal / 250) * 300} x2="800" y2={300 - (gridVal / 250) * 300} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5,5" />
                            <text x="-5" y={305 - (gridVal / 250) * 300} textAnchor="end" fontSize="10" fill="#94a3b8">{gridVal}</text>
                          </g>
                        ))}
                        
                        {/* Reference zones */}
                        <rect x="0" y={300 - (140 / 250) * 300} width="800" height={(70 / 250) * 300} fill="#10b981" fillOpacity="0.05" />
                        <text x="5" y={300 - (105 / 250) * 300} fontSize="11" fill="#059669" fontWeight="500">Normal Range</text>
                        
                        {/* Line and area chart */}
                        {(() => {
                          const readings = glucoseData.readings.slice(0, 24).reverse();
                          if (readings.length === 0) return null;
                          
                          const minVal = Math.min(...readings.map(r => Number(r?.value) || 0));
                          const maxVal = Math.max(...readings.map(r => Number(r?.value) || 0));
                          const range = Math.max(maxVal - minVal, 50);
                          const normalized = readings.map((r, i) => {
                            const val = Number(r?.value) || 0;
                            const x = (i / (readings.length - 1)) * 800;
                            const y = 300 - ((val - (minVal - 10)) / (range + 20)) * 300;
                            return { x, y, val, status: r?.status, timestamp: r?.timestamp };
                          });
                          
                          const pathD = normalized.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                          const areaPathD = pathD + ` L 800 300 L 0 300 Z`;
                          
                          return (
                            <>
                              {/* Area fill */}
                              <path d={areaPathD} fill="url(#areaGradient)" />
                              
                              {/* Line */}
                              <path d={pathD} stroke="#3b82f6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                              
                              {/* Data points */}
                              {normalized.map((p, i) => (
                                <g key={`point-${i}`} className="group cursor-pointer">
                                  <circle cx={p.x} cy={p.y} r="4" fill={p.status === 'high' ? '#f97316' : p.status === 'low' ? '#ef4444' : '#3b82f6'} opacity="0.7" />
                                  <circle cx={p.x} cy={p.y} r="6" fill="none" stroke={p.status === 'high' ? '#f97316' : p.status === 'low' ? '#ef4444' : '#3b82f6'} strokeWidth="2" opacity="0" className="group-hover:opacity-100 transition-opacity" />
                                  {/* Tooltip */}
                                  <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect x={p.x - 35} y={p.y - 30} width="70" height="25" fill="#1e293b" rx="4" />
                                    <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fill="white" fontWeight="bold">{p.val} mg/dL</text>
                                    <text x={p.x} y={p.y + 1} textAnchor="middle" fontSize="9" fill="#cbd5e1">{new Date(p.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</text>
                                  </g>
                                </g>
                              ))}
                            </>
                          );
                        })()}
                      </svg>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-slate-500">
                        <div className="text-center">
                          <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <p>No glucose readings available</p>
                          <p className="text-sm">Start logging readings to see your trends</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chart Legend */}
                  <div className="flex justify-center space-x-6 mt-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <span className="text-sm text-slate-600">Normal (70-140)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <span className="text-sm text-slate-600">High ({'>'}140)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-slate-600">Low ({'<'}70)</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-80 bg-gradient-to-br from-slate-50 to-emerald-50 rounded-xl p-6 flex flex-col items-center justify-start overflow-y-auto">
                  {medications.length === 0 ? (
                    <div className="flex items-center justify-center w-full h-full text-slate-500">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.1 0-2 .9-2 2v6a2 2 0 002 2h4a2 2 0 002-2v-6c0-1.1-.9-2-2-2h-4z" />
                        </svg>
                        <p>No medications found</p>
                        <p className="text-sm">Add medications to view adherence trends</p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full space-y-3">
                      {medications.map((med, idx) => {
                        const medName = med?.name || med?.title || 'Unknown Medication';
                        const doseValue = med?.dose?.amount || med?.dosage?.amount || med?.dose || med?.dosage || '—';
                        const doseUnit = med?.dose?.unit || med?.dosage?.unit || '';
                        const doseDisplay = typeof doseValue === 'object' ? '—' : `${doseValue}${doseUnit ? ` ${doseUnit}` : ''}`;
                        
                        // Handle frequency as object or string
                        let frequencyDisplay = '—';
                        if (med?.frequency) {
                          if (typeof med.frequency === 'object') {
                            frequencyDisplay = med.frequency.timesPerDay ? `${med.frequency.timesPerDay}x/day` : med.frequency.times || '—';
                          } else if (typeof med.frequency === 'string') {
                            frequencyDisplay = med.frequency;
                          }
                        }
                        
                        const adherence = med?.adherence || 0;
                        
                        return (
                          <div key={med._id || idx} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-sm font-semibold text-slate-800">{medName}</div>
                                <div className="text-xs text-slate-500 mt-1">Dose: {doseDisplay}</div>
                                <div className="text-xs text-slate-500">Frequency: {frequencyDisplay}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-emerald-600">{adherence}%</div>
                                <div className="text-xs text-slate-500">Adherence</div>
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(adherence, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Insights Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* AI Insights */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-right animation-delay-700">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                AI Insights
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border-l-4 border-blue-500">
                  <p className="text-sm text-blue-800 font-medium">Great Progress!</p>
                  <p className="text-xs text-blue-700 mt-1">Your time in range improved by 12% this week.</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border-l-4 border-amber-500">
                  <p className="text-sm text-amber-800 font-medium">Pattern Detected</p>
                  <p className="text-xs text-amber-700 mt-1">Higher readings after lunch. Consider adjusting meal timing.</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border-l-4 border-emerald-500">
                  <p className="text-sm text-emerald-800 font-medium">Medication Adherence</p>
                  <p className="text-xs text-emerald-700 mt-1">Excellent! 98% adherence rate this month.</p>
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-right animation-delay-800">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Health Goals</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Time in Range</span>
                    <span className="text-sm text-slate-600">75% / 80%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-1000" style={{ width: '94%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Daily Readings</span>
                    <span className="text-sm text-slate-600">6 / 4</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-1000" style={{ width: '100%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Exercise Minutes</span>
                    <span className="text-sm text-slate-600">120 / 150</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6 animate-slide-in-right animation-delay-900">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-300 text-left group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-900 group-hover:text-blue-700 transition-colors duration-300">Log Reading</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-gradient-to-r from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 rounded-xl transition-all duration-300 text-left group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-700 transition-colors duration-300">Export Report</span>
                  </div>
                </button>
                
                <button className="w-full p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-300 text-left group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-900 group-hover:text-purple-700 transition-colors duration-300">Set Goals</span>
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
