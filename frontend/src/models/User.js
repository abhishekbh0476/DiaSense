import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot be more than 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  diabetesType: {
    type: String,
    enum: ['type1', 'type2', 'gestational', 'prediabetes', 'other', 'prefer-not-to-say', ''],
    default: ''
  },
  subscribeNewsletter: {
    type: Boolean,
    default: false
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: ''
  },
  // Health-related fields for glucose tracking
  glucoseReadings: [{
    value: {
      type: Number,
      required: true,
      min: 0,
      max: 1000
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    mealContext: {
      type: String,
      enum: ['fasting', 'before-meal', 'after-meal', 'bedtime', 'random'],
      default: 'random'
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    reminderTimes: [String],
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    units: {
      glucose: {
        type: String,
        enum: ['mg/dL', 'mmol/L'],
        default: 'mg/dL'
      }
    },
    notifications: {
      glucoseReminders: {
        type: Boolean,
        default: true
      },
      medicationReminders: {
        type: Boolean,
        default: true
      },
      weeklyReports: {
        type: Boolean,
        default: true
      }
    },
    targetRanges: {
      fastingGlucose: {
        min: {
          type: Number,
          default: 80
        },
        max: {
          type: Number,
          default: 130
        }
      },
      postMealGlucose: {
        min: {
          type: Number,
          default: 80
        },
        max: {
          type: Number,
          default: 180
        }
      }
    }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deleted'],
    default: 'active'
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for user's full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for user's age
UserSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Index for better query performance (email index is automatic due to unique: true)
UserSchema.index({ createdAt: -1 });
UserSchema.index({ 'glucoseReadings.timestamp': -1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  try {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) return next();

    console.log('Hashing password for user:', this.email);
    
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    
    console.log('Password hashed successfully');
    next();
  } catch (error) {
    console.error('Password hashing error:', error);
    next(error);
  }
});

// Instance method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Instance method to get user without sensitive data
UserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email with password
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email }).select('+password');
};

// Static method to get user's recent glucose readings
UserSchema.statics.getRecentGlucoseReadings = function(userId, limit = 10) {
  return this.findById(userId)
    .select('glucoseReadings')
    .slice('glucoseReadings', -limit);
};

// Prevent duplicate model compilation
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;
