import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['emergency', 'critical', 'warning', 'info'],
    required: true
  },
  category: {
    type: String,
    enum: ['glucose', 'medication', 'emergency', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    glucoseValue: Number,
    medicationId: mongoose.Schema.Types.ObjectId,
    location: {
      latitude: Number,
      longitude: Number,
      address: String
    }
  },
  sentTo: [{
    type: {
      type: String,
      enum: ['caregiver', 'doctor', 'emergency_services']
    },
    contactId: mongoose.Schema.Types.ObjectId,
    sentAt: Date,
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: Date
  }],
  resolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  priority: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

// Index for efficient queries
alertSchema.index({ userId: 1, type: 1, createdAt: -1 });
alertSchema.index({ userId: 1, resolved: 1, createdAt: -1 });

export default mongoose.models.Alert || mongoose.model('Alert', alertSchema);
