import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['comprehensive', 'glucose', 'medication', 'lifestyle'],
    required: true
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    label: String
  },
  data: {
    glucoseStats: {
      average: Number,
      min: Number,
      max: Number,
      timeInRange: Number,
      readings: Number
    },
    medicationStats: {
      adherenceRate: Number,
      totalDoses: Number,
      missedDoses: Number
    },
    insights: [{
      type: String,
      message: String,
      severity: String
    }]
  },
  fileUrl: {
    type: String // URL to generated PDF
  },
  fileSize: {
    type: Number // in bytes
  },
  pages: {
    type: Number
  },
  sharedWith: [{
    type: {
      type: String,
      enum: ['doctor', 'caregiver']
    },
    contactId: mongoose.Schema.Types.ObjectId,
    sharedAt: {
      type: Date,
      default: Date.now
    },
    accessLevel: {
      type: String,
      enum: ['view', 'download'],
      default: 'view'
    }
  }],
  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },
  generatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.models.Report || mongoose.model('Report', reportSchema);
