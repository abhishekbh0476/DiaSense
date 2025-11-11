import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  type: {
    type: String,
    required: true,
    enum: ['virtual', 'in-person', 'hybrid'],
    default: 'virtual'
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(date) {
        return date > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  time: {
    type: String,
    required: [true, 'Event time is required']
  },
  location: {
    type: String,
    trim: true,
    maxlength: [500, 'Location cannot exceed 500 characters']
  },
  maxAttendees: {
    type: Number,
    default: 50,
    min: [1, 'Maximum attendees must be at least 1'],
    max: [1000, 'Maximum attendees cannot exceed 1000']
  },
  attendees: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizer: {
    type: String,
    required: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    enum: ['workshop', 'support-meeting', 'cooking-class', 'exercise', 'webinar', 'social', 'educational', 'fundraiser', 'awareness', 'family-friendly'],
    default: 'educational'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  requiresApproval: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    trim: true
  },
  materials: [{
    name: String,
    url: String,
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'image']
    }
  }],
  feedback: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
EventSchema.index({ organizerId: 1 });
EventSchema.index({ date: 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ category: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ status: 1 });
EventSchema.index({ isPublic: 1, date: 1 });

// Virtual for attendee count
EventSchema.virtual('attendeeCount').get(function() {
  return this.attendees ? this.attendees.filter(a => a.status === 'registered').length : 0;
});

// Virtual for available spots
EventSchema.virtual('availableSpots').get(function() {
  return this.maxAttendees - this.attendeeCount;
});

// Virtual for average rating
EventSchema.virtual('averageRating').get(function() {
  if (!this.feedback || this.feedback.length === 0) return 0;
  const sum = this.feedback.reduce((acc, f) => acc + f.rating, 0);
  return (sum / this.feedback.length).toFixed(1);
});

// Method to register an attendee
EventSchema.methods.registerAttendee = function(userId, name) {
  // Check if already registered
  const existingAttendee = this.attendees.find(a => a.userId.equals(userId));
  if (existingAttendee) {
    throw new Error('User is already registered for this event');
  }
  
  // Check if event is full
  if (this.attendeeCount >= this.maxAttendees) {
    throw new Error('Event is full');
  }
  
  // Check if event is in the future
  if (this.date <= new Date()) {
    throw new Error('Cannot register for past events');
  }
  
  this.attendees.push({
    userId,
    name,
    status: 'registered'
  });
  
  return this.save();
};

// Method to cancel registration
EventSchema.methods.cancelRegistration = function(userId) {
  const attendeeIndex = this.attendees.findIndex(a => a.userId.equals(userId));
  if (attendeeIndex === -1) {
    throw new Error('User is not registered for this event');
  }
  
  this.attendees[attendeeIndex].status = 'cancelled';
  return this.save();
};

// Method to mark attendance
EventSchema.methods.markAttendance = function(userId) {
  const attendee = this.attendees.find(a => a.userId.equals(userId));
  if (!attendee) {
    throw new Error('User is not registered for this event');
  }
  
  attendee.status = 'attended';
  return this.save();
};

// Method to add feedback
EventSchema.methods.addFeedback = function(userId, rating, comment) {
  // Check if user attended the event
  const attendee = this.attendees.find(a => a.userId.equals(userId));
  if (!attendee || attendee.status !== 'attended') {
    throw new Error('Only attendees can provide feedback');
  }
  
  // Remove existing feedback from this user
  this.feedback = this.feedback.filter(f => !f.userId.equals(userId));
  
  // Add new feedback
  this.feedback.push({
    userId,
    rating,
    comment
  });
  
  return this.save();
};

// Static method to get upcoming events
EventSchema.statics.getUpcoming = function(limit = 10) {
  return this.find({ 
    date: { $gte: new Date() },
    status: 'upcoming',
    isPublic: true
  })
  .sort({ date: 1 })
  .limit(limit);
};

// Static method to get events by type
EventSchema.statics.getByType = function(type, limit = 10) {
  return this.find({ 
    type,
    date: { $gte: new Date() },
    status: 'upcoming',
    isPublic: true
  })
  .sort({ date: 1 })
  .limit(limit);
};

// Pre-save middleware to update status based on date
EventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.date);
  
  if (eventDate < now && this.status === 'upcoming') {
    this.status = 'completed';
  }
  
  next();
});

// Ensure virtual fields are serialized
EventSchema.set('toJSON', { virtuals: true });
EventSchema.set('toObject', { virtuals: true });

export default mongoose.models.Event || mongoose.model('Event', EventSchema);
