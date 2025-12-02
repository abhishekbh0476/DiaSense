'use client';

import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import Layout from '../../components/Layout';

export default function MonitorPage() {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [device, setDevice] = useState(null);
  const [characteristic, setCharacteristic] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [spo2, setSpo2] = useState('--');
  const [hr, setHr] = useState('--');
  const [bp, setBp] = useState('--/--');

  useEffect(() => {
    const ctx = canvasRef.current && canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'IR Signal',
            data: [],
            borderColor: '#ef4444',
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        animation: false,
        scales: { x: { display: false }, y: { min: 0, max: 200000 } },
        plugins: { legend: { display: false } },
      },
    });

    return () => {
      try {
        chartRef.current?.destroy();
      } catch (e) {}
    };
  }, []);

  const updatePPG = (value) => {
    const chart = chartRef.current;
    if (!chart) return;
    const data = chart.data.datasets[0].data;
    data.push(value);
    if (data.length > 150) data.shift();
    chart.data.labels.push('');
    if (chart.data.labels.length > 150) chart.data.labels.shift();
    chart.update('none');
  };

  const parseMetrics = (text) => {
    const spo2Match = text.match(/SpO2:(\d+)%/);
    const hrMatch = text.match(/Heart Rate:(\d+)/);
    const bpMatch = text.match(/BP:(\d+)\/(\d+)/);
    if (spo2Match) setSpo2(`${spo2Match[1]}`);
    if (hrMatch) setHr(`${hrMatch[1]}`);
    if (bpMatch) setBp(`${bpMatch[1]}/${bpMatch[2]}`);
  };

  const handleNotification = (event) => {
    const text = new TextDecoder().decode(event.target.value);
    if (text.startsWith('PPG:')) {
      const val = parseInt(text.split(':')[1]);
      if (!isNaN(val)) updatePPG(val);
    } else {
      parseMetrics(text);
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
      char.addEventListener('characteristicvaluechanged', handleNotification);
      setCharacteristic(char);
      setConnected(true);
    } catch (err) {
      // eslint-disable-next-line no-console
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
      try { characteristic.removeEventListener('characteristicvaluechanged', handleNotification); } catch (e) {}
      setCharacteristic(null);
    }
    setDevice(null);
    setConnected(false);
    setSpo2('--');
    setHr('--');
    setBp('--/--');
    if (chartRef.current) {
      chartRef.current.data.datasets[0].data = [];
      chartRef.current.data.labels = [];
      chartRef.current.update();
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Health Monitor</h1>
                <p className="text-sm text-gray-500">ESP32 Vital Signs</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 text-green-600 text-sm ${connected ? '' : 'hidden'}`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Connected
              </div>

              <button
                onClick={connectToDevice}
                disabled={connecting || connected}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors ${connecting || connected ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <span>{connected ? 'Connected' : connecting ? 'Connecting...' : 'Connect Device'}</span>
              </button>

              <button
                onClick={disconnect}
                className={`px-6 py-3 rounded-lg text-white ${connected ? 'bg-red-500 hover:bg-red-600' : 'hidden'}`}>
                Disconnect
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">SpO₂</h3>
            <div id="spo2Value" className="text-4xl font-bold text-gray-400">{spo2}<span className="text-2xl">%</span></div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Heart Rate</h3>
            <div id="hrValue" className="text-4xl font-bold text-gray-400">{hr}<span className="text-2xl"> bpm</span></div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:col-span-2">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Blood Pressure (Estimated)</h3>
            <div id="bpValue" className="text-4xl font-bold text-gray-400">{bp}<span className="text-2xl"> mmHg</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">PPG Waveform</h3>
            <button onClick={() => {
              // retake action: clear chart and reset values
              if (chartRef.current) {
                chartRef.current.data.datasets[0].data = [];
                chartRef.current.data.labels = [];
                chartRef.current.update();
              }
              setSpo2('--'); setHr('--'); setBp('--/--');
            }} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              Retake
            </button>
          </div>
          <canvas ref={canvasRef} className="w-full h-48" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
