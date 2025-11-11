'use client';

import { useState } from 'react';

export default function AddGlucoseModal({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    value: '',
    unit: 'mg/dL',
    mealContext: 'random',
    timestamp: new Date().toISOString().slice(0, 16), // Format for datetime-local input
    notes: '',
    symptoms: [],
    location: 'finger',
    medicationTaken: false,
    exerciseRecent: false,
    stressLevel: 5,
    sleepQuality: 5
  });

  const [errors, setErrors] = useState({});

  const mealContextOptions = [
    { value: 'fasting', label: 'Fasting (8+ hours)' },
    { value: 'before_meal', label: 'Before Meal' },
    { value: 'after_meal', label: 'After Meal (1-2 hours)' },
    { value: 'bedtime', label: 'Bedtime' },
    { value: 'random', label: 'Random' }
  ];

  const symptomOptions = [
    { display: 'None', value: 'none' },
    { display: 'Dizzy', value: 'dizzy' },
    { display: 'Shaky', value: 'shaky' },
    { display: 'Sweating', value: 'sweaty' },
    { display: 'Hungry', value: 'hungry' },
    { display: 'Confused', value: 'confused' },
    { display: 'Irritable', value: 'irritable' },
    { display: 'Tired', value: 'tired' },
    { display: 'Thirsty', value: 'thirsty' },
    { display: 'Frequent Urination', value: 'frequent_urination' }
  ];

  // Mapping for symptom conversion
  const symptomMap = {
    'None': 'none',
    'Dizzy': 'dizzy',
    'Shaky': 'shaky',
    'Sweating': 'sweaty',
    'Hungry': 'hungry',
    'Confused': 'confused',
    'Irritable': 'irritable',
    'Tired': 'tired',
    'Thirsty': 'thirsty',
    'Frequent Urination': 'frequent_urination'
  };

  const locationOptions = [
    { value: 'finger', label: 'Finger' },
    { value: 'palm', label: 'Palm' },
    { value: 'arm', label: 'Arm' },
    { value: 'cgm', label: 'CGM Device' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    const glucoseValue = parseFloat(formData.value);
    
    if (!formData.value) {
      newErrors.value = 'Glucose value is required';
    } else if (isNaN(glucoseValue) || glucoseValue < 20 || glucoseValue > 600) {
      newErrors.value = 'Please enter a valid glucose value between 20 and 600 mg/dL';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const glucoseData = {
      ...formData,
      value: glucoseValue,
      timestamp: new Date(formData.timestamp),
      symptoms: formData.symptoms.map(symptom => symptomMap[symptom] || symptom)
    };

    onSubmit(glucoseData);
  };

  const toggleSymptom = (symptom) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const getGlucoseStatus = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return { status: '', color: 'text-gray-500' };
    
    if (numValue < 70) return { status: 'Low', color: 'text-red-600' };
    if (numValue > 180) return { status: 'High', color: 'text-orange-600' };
    return { status: 'Normal', color: 'text-green-600' };
  };

  const glucoseStatus = getGlucoseStatus(formData.value);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Log Glucose Reading</h2>
              <p className="text-gray-600">Record your blood glucose measurement</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Glucose Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Glucose Reading (mg/dL) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="600"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  className="w-full px-4 py-3 text-2xl font-bold border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  placeholder="120"
                />
                {formData.value && (
                  <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-sm font-medium ${glucoseStatus.color}`}>
                    {glucoseStatus.status}
                  </div>
                )}
              </div>
              {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
              <p className="text-xs text-gray-500 mt-1">Normal range: 70-180 mg/dL</p>
            </div>

            {/* Date and Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={formData.timestamp}
                onChange={(e) => setFormData(prev => ({ ...prev, timestamp: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Meal Context */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When did you take this reading?
              </label>
              <select
                value={formData.mealContext}
                onChange={(e) => setFormData(prev => ({ ...prev, mealContext: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {mealContextOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Testing Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Testing Location
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {locationOptions.map(location => (
                  <button
                    key={location.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, location: location.value }))}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                      formData.location === location.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {location.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Any symptoms? (Optional)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {symptomOptions.map(symptom => (
                  <button
                    key={symptom.value}
                    type="button"
                    onClick={() => toggleSymptom(symptom.display)}
                    className={`p-2 rounded-lg text-sm transition-all duration-200 ${
                      formData.symptoms.includes(symptom.display)
                        ? 'bg-red-100 text-red-700 border-2 border-red-300'
                        : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
                    }`}
                  >
                    {symptom.display}
                  </button>
                ))}
              </div>
              {formData.symptoms.length > 0 && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {formData.symptoms.join(', ')}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Any additional notes about this reading, what you ate, activities, etc."
              />
            </div>

            {/* Unit Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Measurement Unit
              </label>
              <div className="flex gap-4">
                {['mg/dL', 'mmol/L'].map(unit => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, unit }))}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium ${
                      formData.unit === unit
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Medication Taken */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.medicationTaken}
                  onChange={(e) => setFormData(prev => ({ ...prev, medicationTaken: e.target.checked }))}
                  className="w-5 h-5 border border-gray-300 rounded accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  I took my medication today
                </span>
              </label>
            </div>

            {/* Exercise Recent */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.exerciseRecent}
                  onChange={(e) => setFormData(prev => ({ ...prev, exerciseRecent: e.target.checked }))}
                  className="w-5 h-5 border border-gray-300 rounded accent-blue-600"
                />
                <span className="text-sm font-medium text-gray-700">
                  I exercised in the last 2 hours
                </span>
              </label>
            </div>

            {/* Stress Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stress Level: <span className="text-blue-600 font-bold">{formData.stressLevel}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.stressLevel}
                onChange={(e) => setFormData(prev => ({ ...prev, stressLevel: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Low</span>
                <span>Very High</span>
              </div>
            </div>

            {/* Sleep Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Sleep Quality Last Night: <span className="text-blue-600 font-bold">{formData.sleepQuality}/10</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.sleepQuality}
                onChange={(e) => setFormData(prev => ({ ...prev, sleepQuality: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Very Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 p-4 rounded-xl">
              <h4 className="font-medium text-blue-900 mb-2">💡 Quick Tips</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Wash your hands before testing</li>
                <li>• Use the side of your fingertip, not the pad</li>
                <li>• Rotate testing sites to avoid soreness</li>
                <li>• Record readings at consistent times for better tracking</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
              >
                Save Reading
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
