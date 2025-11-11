import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
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
  specialty: {
    type: String,
    enum: ['endocrinologist', 'primary_care', 'nutritionist', 'cardiologist', 'ophthalmologist', 'podiatrist', 'other'],
    required: true
  },
  hospital: {
    type: String,
    required: true,
    trim: true
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
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  licenseNumber: {
    type: String,
    trim: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  reportSharing: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'as_needed'],
      default: 'monthly'
    }
  },
  nextAppointment: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Index for efficient queries
doctorSchema.index({ userId: 1, specialty: 1 });
doctorSchema.index({ userId: 1, verified: 1 });

export default mongoose.models.Doctor || mongoose.model('Doctor', doctorSchema);
