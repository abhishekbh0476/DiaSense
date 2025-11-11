import mongoose from 'mongoose';

const medicationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medication',
    required: true
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  takenTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'skipped'],
    default: 'pending'
  },
  dosageTaken: {
    amount: Number,
    unit: String
  },
  notes: {
    type: String,
    maxlength: 300
  },
  sideEffectsExperienced: [{
    type: String
  }],
  reminderSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
medicationLogSchema.index({ userId: 1, scheduledTime: -1 });
medicationLogSchema.index({ userId: 1, status: 1, scheduledTime: -1 });
medicationLogSchema.index({ medicationId: 1, scheduledTime: -1 });

// Method to calculate adherence rate
medicationLogSchema.statics.getAdherenceRate = function(userId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        scheduledTime: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        taken: {
          $sum: {
            $cond: [{ $eq: ['$status', 'taken'] }, 1, 0]
          }
        }
      }
    },
    {
      $project: {
        adherenceRate: {
          $multiply: [
            { $divide: ['$taken', '$total'] },
            100
          ]
        },
        totalDoses: '$total',
        takenDoses: '$taken'
      }
    }
  ]);
};

export default mongoose.models.MedicationLog || mongoose.model('MedicationLog', medicationLogSchema);
