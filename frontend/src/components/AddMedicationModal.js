'use client';

import { useState } from 'react';

export default function AddMedicationModal({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    dosage: {
      amount: '',
      unit: 'mg'
    },
    frequency: {
      timesPerDay: 1,
      specificTimes: ['08:00']
    },
    instructions: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    prescribedBy: '',
    notes: '',
    reminderEnabled: true
  });

  const [errors, setErrors] = useState({});

  const dosageUnits = ['mg', 'g', 'ml', 'units', 'tablets', 'capsules', 'drops'];
  const commonMedications = [
    'Metformin', 'Insulin', 'Glipizide', 'Januvia', 'Lantus', 'Humalog',
    'Glucophage', 'Amaryl', 'Actos', 'Victoza', 'Jardiance', 'Invokana'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Medication name is required';
    if (!formData.dosage.amount) newErrors.dosage = 'Dosage amount is required';
    if (formData.frequency.timesPerDay < 1) newErrors.frequency = 'Frequency must be at least 1 time per day';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data for submission
    const medicationData = {
      ...formData,
      type: 'medication', // Add required type field
      dosage: {
        amount: parseFloat(formData.dosage.amount),
        unit: formData.dosage.unit
      },
      frequency: {
        timesPerDay: parseInt(formData.frequency.timesPerDay),
        times: formData.frequency.specificTimes.map(timeString => {
          const [hour, minute] = timeString.split(':');
          return {
            hour: parseInt(hour),
            minute: parseInt(minute)
          };
        })
      },
      reminders: {
        enabled: formData.reminderEnabled,
        minutesBefore: 15
      }
    };

    onSubmit(medicationData);
  };

  const handleFrequencyChange = (times) => {
    const newTimes = parseInt(times);
    const currentTimes = formData.frequency.specificTimes;
    
    let newSpecificTimes = [...currentTimes];
    
    if (newTimes > currentTimes.length) {
      // Add more times
      for (let i = currentTimes.length; i < newTimes; i++) {
        const hour = 8 + (i * 8); // Spread throughout the day
        newSpecificTimes.push(`${hour.toString().padStart(2, '0')}:00`);
      }
    } else if (newTimes < currentTimes.length) {
      // Remove excess times
      newSpecificTimes = newSpecificTimes.slice(0, newTimes);
    }

    setFormData(prev => ({
      ...prev,
      frequency: {
        timesPerDay: newTimes,
        specificTimes: newSpecificTimes
      }
    }));
  };

  const updateSpecificTime = (index, time) => {
    const newTimes = [...formData.frequency.specificTimes];
    newTimes[index] = time;
    setFormData(prev => ({
      ...prev,
      frequency: {
        ...prev.frequency,
        specificTimes: newTimes
      }
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Medication</h2>
              <p className="text-gray-600">Enter your medication details and schedule</p>
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
            {/* Medication Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Medication Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Enter medication name"
                list="common-medications"
              />
              <datalist id="common-medications">
                {commonMedications.map(med => (
                  <option key={med} value={med} />
                ))}
              </datalist>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Dosage */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dosage Amount *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.dosage.amount}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dosage: { ...prev.dosage, amount: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="500"
                />
                {errors.dosage && <p className="text-red-500 text-sm mt-1">{errors.dosage}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit
                </label>
                <select
                  value={formData.dosage.unit}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    dosage: { ...prev.dosage, unit: e.target.value }
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {dosageUnits.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How many times per day? *
              </label>
              <select
                value={formData.frequency.timesPerDay}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num}>{num} time{num > 1 ? 's' : ''} per day</option>
                ))}
              </select>
            </div>

            {/* Specific Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Times
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.frequency.specificTimes.map((time, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-500 mb-1">
                      Time {index + 1}
                    </label>
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => updateSpecificTime(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows="3"
                placeholder="Take with food, avoid alcohol, etc."
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Prescribed By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prescribed By
              </label>
              <input
                type="text"
                value={formData.prescribedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, prescribedBy: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Dr. Smith"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows="2"
                placeholder="Any additional notes about this medication"
              />
            </div>

            {/* Reminder Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="reminder"
                checked={formData.reminderEnabled}
                onChange={(e) => setFormData(prev => ({ ...prev, reminderEnabled: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="reminder" className="text-sm font-medium text-gray-700">
                Enable medication reminders
              </label>
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
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200"
              >
                Add Medication
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
