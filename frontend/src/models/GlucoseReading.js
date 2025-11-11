import mongoose from 'mongoose';

const glucoseReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 20,
    max: 600
  },
  unit: {
    type: String,
    enum: ['mg/dL', 'mmol/L'],
    default: 'mg/dL'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  mealContext: {
    type: String,
    enum: ['fasting', 'before_meal', 'after_meal', 'bedtime', 'random'],
    default: 'random'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  symptoms: [{
    type: String,
    enum: ['none', 'dizzy', 'shaky', 'sweaty', 'hungry', 'confused', 'irritable', 'tired', 'thirsty', 'frequent_urination']
  }],
  medicationTaken: {
    type: Boolean,
    default: false
  },
  exerciseRecent: {
    type: Boolean,
    default: false
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 10
  }
}, {
  timestamps: true
});

// Index for efficient queries
glucoseReadingSchema.index({ userId: 1, timestamp: -1 });
glucoseReadingSchema.index({ userId: 1, createdAt: -1 });

// Virtual for status based on value
glucoseReadingSchema.virtual('status').get(function() {
  if (this.value < 70) return 'low';
  if (this.value > 140) return 'high';
  return 'normal';
});

// Method to get readings for a date range
glucoseReadingSchema.statics.getReadingsInRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    timestamp: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ timestamp: -1 });
};

// Method to get average glucose for a period
glucoseReadingSchema.statics.getAverageGlucose = function(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        timestamp: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        avgGlucose: { $avg: '$value' },
        count: { $sum: 1 },
        minGlucose: { $min: '$value' },
        maxGlucose: { $max: '$value' }
      }
    }
  ]);
};

export default mongoose.models.GlucoseReading || mongoose.model('GlucoseReading', glucoseReadingSchema);
