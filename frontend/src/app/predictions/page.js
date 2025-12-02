'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/Layout';

export default function Predictions() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [activeAlert, setActiveAlert] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPredictions();
    }
  }, [isAuthenticated]);

  const loadPredictions = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setPredictions([
        {
          id: 1,
          type: 'warning',
          severity: 'high',
          title: 'Potential Low Blood Sugar',
          message: 'Your glucose may drop in the next 2 hours if you skip a snack.',
          confidence: 87,
          timeframe: '2 hours',
          factors: ['Skipped afternoon snack', 'High morning insulin', 'Increased activity'],
          recommendation: 'Have a 15g carb snack now to prevent hypoglycemia',
          timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000)
        },
        {
          id: 2,
          type: 'info',
          severity: 'medium',
          title: 'Post-Meal Spike Expected',
          message: 'Based on your meal log, expect glucose rise in 30-45 minutes.',
          confidence: 92,
          timeframe: '45 minutes',
          factors: ['High carb lunch', 'Delayed insulin timing', 'Stress levels elevated'],
          recommendation: 'Consider a short walk after eating to help manage the spike',
          timestamp: new Date(Date.now() + 45 * 60 * 1000)
        },
        {
          id: 3,
          type: 'success',
          severity: 'low',
          title: 'Optimal Range Predicted',
          message: 'Your glucose levels are expected to remain stable for the next 4 hours.',
          confidence: 94,
          timeframe: '4 hours',
          factors: ['Consistent meal timing', 'Regular medication', 'Good sleep quality'],
          recommendation: 'Continue your current routine for optimal glucose control',
          timestamp: new Date(Date.now() + 4 * 60 * 60 * 1000)
        }
      ]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const dismissAlert = (id) => {
    setPredictions(prev => prev.filter(p => p.id !== id));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getAlertColors = (type, severity) => {
    const baseColors = {
      warning: {
        bg: 'from-amber-50 to-orange-100',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        accent: 'bg-amber-500'
      },
      info: {
        bg: 'from-blue-50 to-indigo-100',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        accent: 'bg-blue-500'
      },
      success: {
        bg: 'from-emerald-50 to-green-100',
        border: 'border-emerald-200',
        icon: 'text-emerald-600',
        accent: 'bg-emerald-500'
      }
    };

    return baseColors[type] || baseColors.info;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading AI predictions...</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent animate-slide-up">
                AI Predictions & Alerts
              </h1>
              <p className="text-slate-600 mt-2 animate-slide-up animation-delay-100">
                Smart glucose predictions powered by machine learning
              </p>
            </div>
            
            <button
              onClick={loadPredictions}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed animate-slide-in-right"
            >
              {isAnalyzing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh Analysis</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* AI Analysis Status */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-100 rounded-2xl p-6 mb-8 animate-slide-up animation-delay-200 border border-purple-200">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center animate-pulse">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">AI Analysis Active</h3>
              <p className="text-slate-600 text-sm">
                Continuously monitoring your glucose patterns, food intake, medication timing, and activity levels
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">94%</div>
              <div className="text-xs text-slate-500">Accuracy Rate</div>
            </div>
          </div>
        </div>

        {/* Predictions Grid */}
        <div className="space-y-6">
          {predictions.map((prediction, index) => {
            const colors = getAlertColors(prediction.type, prediction.severity);
            
            return (
              <div
                key={prediction.id}
                className={`bg-gradient-to-r ${colors.bg} rounded-2xl border ${colors.border} p-6 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] animate-slide-up`}
                style={{ animationDelay: `${(index + 3) * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Alert Icon */}
                    <div className={`w-12 h-12 ${colors.icon} bg-white rounded-xl flex items-center justify-center shadow-md animate-bounce-gentle`}>
                      {getAlertIcon(prediction.type)}
                    </div>
                    
                    {/* Alert Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{prediction.title}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 ${colors.accent} rounded-full animate-pulse`}></div>
                          <span className="text-xs font-medium text-slate-600">
                            {prediction.timeframe}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-slate-700 mb-4">{prediction.message}</p>
                      
                      {/* Confidence Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-slate-600">Confidence Level</span>
                          <span className="text-sm font-bold text-slate-900">{prediction.confidence}%</span>
                        </div>
                        <div className="w-full bg-white rounded-full h-2 shadow-inner">
                          <div 
                            className={`h-2 ${colors.accent} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${prediction.confidence}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Contributing Factors */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Contributing Factors:</h4>
                        <div className="flex flex-wrap gap-2">
                          {prediction.factors.map((factor, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-white bg-opacity-70 rounded-full text-xs font-medium text-slate-700 border border-white border-opacity-50 animate-fade-in"
                              style={{ animationDelay: `${idx * 100}ms` }}
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Recommendation */}
                      <div className="bg-white bg-opacity-50 rounded-xl p-4 border border-white border-opacity-30">
                        <h4 className="text-sm font-semibold text-slate-800 mb-1 flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          AI Recommendation
                        </h4>
                        <p className="text-sm text-slate-700">{prediction.recommendation}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setActiveAlert(prediction.id)}
                      className="p-2 bg-white bg-opacity-70 hover:bg-opacity-100 rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md"
                    >
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5V7a12 12 0 0124 0v10z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => dismissAlert(prediction.id)}
                      className="p-2 bg-white bg-opacity-70 hover:bg-red-100 rounded-lg transition-all duration-300 transform hover:scale-110 shadow-md group"
                    >
                      <svg className="w-5 h-5 text-slate-600 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CGM Integration Panel */}
        <div className="mt-8 bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 animate-slide-up animation-delay-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">CGM Integration</h3>
                <p className="text-slate-600 text-sm">Connect your continuous glucose monitor for real-time predictions</p>
              </div>
            </div>
            <button
              onClick={() => router.push('/monitor')}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Connect Device
            </button>
          </div>
        </div>

        {/* Empty State */}
        {predictions.length === 0 && !isAnalyzing && (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Predictions Available</h3>
            <p className="text-slate-600 mb-6">
              Start logging your glucose readings, meals, and activities to get AI-powered predictions
            </p>
            <button
              onClick={loadPredictions}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Generate Predictions
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
