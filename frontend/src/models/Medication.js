import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['insulin', 'metformin', 'sulfonylurea', 'dpp4_inhibitor', 'sglt2_inhibitor', 'glp1_agonist', 'other'],
    required: true
  },
  dosage: {
    amount: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['mg', 'units', 'ml', 'tablets'],
      required: true
    }
  },
  frequency: {
    timesPerDay: {
      type: Number,
      required: true,
      min: 1,
      max: 6
    },
    times: [{
      hour: { type: Number, min: 0, max: 23 },
      minute: { type: Number, min: 0, max: 59 }
    }]
  },
  instructions: {
    type: String,
    maxlength: 500
  },
  prescribedBy: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sideEffects: [{
    type: String
  }],
  reminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    minutesBefore: {
      type: Number,
      default: 15
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
medicationSchema.index({ userId: 1, isActive: 1 });
medicationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Medication || mongoose.model('Medication', medicationSchema);
