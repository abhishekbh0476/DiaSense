'use client';

import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function MonitorPage() {
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [spo2, setSpo2] = useState('--');
  const [hr, setHr] = useState('--');
  const [gsr, setGsr] = useState('--');
  const [glucose, setGlucose] = useState('--');
  const [diabetesStatus, setDiabetesStatus] = useState('--');
  const [riskLevel, setRiskLevel] = useState('--');
  const [recommendation, setRecommendation] = useState('--');
  const [loading, setLoading] = useState(false);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'text-blue-500';
      case 'Normal':
        return 'text-green-500';
      case 'Elevated':
        return 'text-yellow-500';
      case 'High':
        return 'text-orange-500';
      case 'Critical':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskBgColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'bg-blue-50 border-blue-200';
      case 'Normal':
        return 'bg-green-50 border-green-200';
      case 'Elevated':
        return 'bg-yellow-50 border-yellow-200';
      case 'High':
        return 'bg-orange-50 border-orange-200';
      case 'Critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const connectToDevice = async () => {
    try {
      setConnecting(true);
      const dev = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32 Health Monitor' }],
        optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'],
      });
      setDevice(dev);
      const server = await dev.gatt.connect();
      const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
      const char = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');
      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', handleData);
      setCharacteristic(char);
      setConnected(true);
    } catch (err) {
      console.error('Connection failed:', err);
      alert('Connection failed: ' + err);
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = () => {
    try {
      if (device?.gatt?.connected) device.gatt.disconnect();
    } catch (e) {
      // ignore
    }
    if (characteristic) {
      try {
        characteristic.removeEventListener('characteristicvaluechanged', handleData);
      } catch (e) {}
      setCharacteristic(null);
    }
    setDevice(null);
    setConnected(false);
    resetValues();
  };

  const handleData = async (event) => {
    const data = new TextDecoder().decode(event.target.value);
    const hrMatch = data.match(/Heart Rate:(\d+)/);
    const spo2Match = data.match(/SpO2:(\d+)%/);
    const gsrMatch = data.match(/GSR:([\d.]+)/);

    const parsedHr = hrMatch ? parseFloat(hrMatch[1]) : null;
    const parsedSpo2 = spo2Match ? parseFloat(spo2Match[1]) : null;
    const parsedGsr = gsrMatch ? parseFloat(gsrMatch[1]) : null;

    if (parsedHr) setHr(parsedHr + ' bpm');
    if (parsedSpo2) setSpo2(parsedSpo2 + '%');
    if (parsedGsr) setGsr(parsedGsr.toFixed(2) + ' V');

    if (parsedHr && parsedSpo2 && parsedGsr && !isNaN(parsedHr) && !isNaN(parsedSpo2) && !isNaN(parsedGsr)) {
      await fetchPrediction(parsedHr, parsedSpo2, parsedGsr);
    }
  };

  const fetchPrediction = async (heartRate, spO2, gsrValue) => {
    try {
      setLoading(true);
      const res = await fetch('/api/predictions/glucose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          HeartRate: heartRate,
          SpO2: spO2,
          GSR: gsrValue,
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const result = await res.json();
      
      if (result.glucose_prediction !== undefined) {
        setGlucose(Math.round(result.glucose_prediction) + ' mg/dL');
      }
      if (result.diabetes_status) {
        setDiabetesStatus(result.diabetes_status);
      }
      if (result.risk_level) {
        setRiskLevel(result.risk_level);
      }
      if (result.recommendation) {
        setRecommendation(result.recommendation);
      }
    } catch (err) {
      console.error('Prediction fetch failed:', err);
      setGlucose('Error');
      setDiabetesStatus('Error');
    } finally {
      setLoading(false);
    }
  };

  const resetValues = () => {
    setSpo2('--');
    setHr('--');
    setGsr('--');
    setGlucose('--');
    setDiabetesStatus('--');
    setRiskLevel('--');
    setRecommendation('--');
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">AI Health Monitor</h1>
              <p className="text-sm text-gray-500">ESP32 + AI Glucose & Diabetes Detection</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`items-center gap-2 text-green-600 text-sm ${connected ? 'flex' : 'hidden'}`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </div>
              <button
                onClick={connectToDevice}
                disabled={connecting || connected}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {connected ? 'Connected' : connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                onClick={disconnect}
                className={`px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ${connected ? '' : 'hidden'}`}
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">SpO₂</h3>
              <div className="text-4xl font-bold text-gray-400">{spo2}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Heart Rate</h3>
              <div className="text-4xl font-bold text-gray-400">{hr}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">GSR</h3>
              <div className="text-4xl font-bold text-gray-400">{gsr}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-1">Predicted Glucose</h3>
              <div className="text-3xl font-bold text-gray-400">{glucose}</div>
            </div>
          </div>

          {/* AI Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
              <h3 className="text-sm font-medium text-gray-600 mb-1">AI Diabetes Status</h3>
              <div className="text-3xl font-bold text-gray-400">{diabetesStatus}</div>
            </div>
            <div className={`rounded-2xl shadow-lg p-6 text-center border-2 ${getRiskBgColor(riskLevel)}`}>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Risk Level</h3>
              <div className={`text-3xl font-bold ${getRiskColor(riskLevel)}`}>{riskLevel}</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">AI Recommendation</h3>
            <p className="text-gray-700">{recommendation}</p>
          </div>

          {/* Retake Button */}
          <div className="text-center">
            <button
              onClick={resetValues}
              disabled={!connected}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Retake Measurement
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
