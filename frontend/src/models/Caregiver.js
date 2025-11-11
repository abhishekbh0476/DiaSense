import mongoose from 'mongoose';

const caregiverSchema = new mongoose.Schema({
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
  relationship: {
    type: String,
    enum: ['spouse', 'parent', 'child', 'sibling', 'friend', 'other'],
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    type: Boolean,
    default: false
  },
  alertsEnabled: {
    type: Boolean,
    default: true
  },
  alertPreferences: {
    lowGlucose: {
      type: Boolean,
      default: true
    },
    highGlucose: {
      type: Boolean,
      default: true
    },
    missedMedication: {
      type: Boolean,
      default: true
    },
    emergencyOnly: {
      type: Boolean,
      default: false
    }
  },
  accessLevel: {
    type: String,
    enum: ['view_only', 'limited', 'full'],
    default: 'limited'
  },
  inviteStatus: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending'
  },
  inviteToken: {
    type: String
  },
  lastActive: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
caregiverSchema.index({ userId: 1, emergencyContact: 1 });
caregiverSchema.index({ userId: 1, alertsEnabled: 1 });
caregiverSchema.index({ inviteToken: 1 });

export default mongoose.models.Caregiver || mongoose.model('Caregiver', caregiverSchema);
