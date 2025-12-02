'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CGMIntegration({ onDataReceived }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [cgmDevice, setCgmDevice] = useState(null);
  const [realtimeData, setRealtimeData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastReading, setLastReading] = useState(null);

  // Simulate CGM device types
  const supportedDevices = [
    { id: 'dexcom-g7', name: 'Dexcom G7', manufacturer: 'Dexcom' },
    { id: 'libre-3', name: 'FreeStyle Libre 3', manufacturer: 'Abbott' },
    { id: 'medtronic-780g', name: 'MiniMed 780G', manufacturer: 'Medtronic' },
    { id: 'omnipod-5', name: 'Omnipod 5', manufacturer: 'Insulet' }
  ];

  // Simulate real-time glucose data
  useEffect(() => {
    let interval;
    if (isConnected && cgmDevice) {
      interval = setInterval(() => {
        // Simulate realistic glucose readings with trends
        const baseValue = lastReading?.value || 120;
        const variation = (Math.random() - 0.5) * 20; // ±10 mg/dL variation
        const newValue = Math.max(70, Math.min(300, baseValue + variation));
        
        const reading = {
          value: Math.round(newValue),
          timestamp: new Date(),
          trend: getTrend(newValue, baseValue),
          device: cgmDevice.name,
          accuracy: 'high'
        };

        setRealtimeData(reading);
        setLastReading(reading);
        
        // Generate predictions
        generatePredictions(reading);
        
        // Notify parent component
        if (onDataReceived) {
          onDataReceived(reading);
        }
      }, 60000); // Update every minute (real CGMs update every 1-5 minutes)
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected, cgmDevice, lastReading, onDataReceived]);

  const router = useRouter();

  const getTrend = (current, previous) => {
    const diff = current - previous;
    if (diff > 5) return 'rising';
    if (diff < -5) return 'falling';
    return 'stable';
  };

  const generatePredictions = (currentReading) => {
    const predictions = [];
    let currentValue = currentReading.value;
    
    // Generate 4 predictions (next 4 time intervals)
    for (let i = 1; i <= 4; i++) {
      const timeOffset = i * 15; // 15-minute intervals
      const trendFactor = currentReading.trend === 'rising' ? 2 : 
                         currentReading.trend === 'falling' ? -2 : 0;
      
      currentValue += trendFactor + (Math.random() - 0.5) * 5;
      currentValue = Math.max(70, Math.min(300, currentValue));
      
      predictions.push({
        time: new Date(Date.now() + timeOffset * 60 * 1000),
        predictedValue: Math.round(currentValue),
        confidence: Math.max(60, 95 - (i * 8)) // Decreasing confidence over time
      });
    }
    
    setPredictions(predictions);
  };

  const handleConnect = async (device) => {
    setIsConnecting(true);
    setConnectionStatus('connecting');
    
    // Simulate connection process
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate connection delay
      
      setCgmDevice(device);
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Initialize with a reading
      const initialReading = {
        value: 120 + Math.round((Math.random() - 0.5) * 40),
        timestamp: new Date(),
        trend: 'stable',
        device: device.name,
        accuracy: 'high'
      };
      
      setRealtimeData(initialReading);
      setLastReading(initialReading);
      
    } catch (error) {
      console.error('CGM connection failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setCgmDevice(null);
    setRealtimeData(null);
    setPredictions([]);
    setConnectionStatus('disconnected');
    setLastReading(null);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getGlucoseColor = (value) => {
    if (value < 70) return 'text-red-600';
    if (value > 180) return 'text-orange-600';
    return 'text-green-600';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'rising':
        return <span className="text-red-500">↗️</span>;
      case 'falling':
        return <span className="text-blue-500">↘️</span>;
      default:
        return <span className="text-gray-500">→</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">CGM Integration</h3>
            <p className="text-sm text-gray-600">Connect your continuous glucose monitor for real-time predictions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`text-sm font-medium ${getStatusColor()}`}>
            {connectionStatus === 'connected' && '🟢 Connected'}
            {connectionStatus === 'connecting' && '🟡 Connecting...'}
            {connectionStatus === 'error' && '🔴 Connection Error'}
            {connectionStatus === 'disconnected' && '⚪ Disconnected'}
          </div>
          <button
            onClick={() => router.push('/monitor')}
            className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Open Monitor
          </button>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Select your CGM device to start receiving real-time glucose data and predictions:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {supportedDevices.map((device) => (
              <button
                key={device.id}
                onClick={() => handleConnect(device)}
                disabled={isConnecting}
                className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-gray-900">{device.name}</div>
                <div className="text-sm text-gray-600">{device.manufacturer}</div>
              </button>
            ))}
          </div>
          
          {isConnecting && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Connecting to device...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Reading */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Glucose</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-3xl font-bold ${getGlucoseColor(realtimeData?.value)}`}>
                    {realtimeData?.value}
                  </span>
                  <span className="text-gray-500">mg/dL</span>
                  {getTrendIcon(realtimeData?.trend)}
                </div>
                <p className="text-xs text-gray-500">
                  {realtimeData?.timestamp.toLocaleTimeString()} • {cgmDevice.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Trend</p>
                <p className="text-lg font-semibold capitalize text-gray-800">
                  {realtimeData?.trend}
                </p>
              </div>
            </div>
          </div>

          {/* Predictions */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Glucose Predictions</h4>
            <div className="space-y-2">
              {predictions.map((prediction, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-purple-600">
                        {(index + 1) * 15}m
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {prediction.time.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {prediction.confidence}% confidence
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-semibold ${getGlucoseColor(prediction.predictedValue)}`}>
                      {prediction.predictedValue}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">mg/dL</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Connected to {cgmDevice.name}
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
