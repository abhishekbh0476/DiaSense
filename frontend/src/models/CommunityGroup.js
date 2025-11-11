import mongoose from 'mongoose';

const communityGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['support', 'nutrition', 'exercise', 'technology', 'general'],
    required: true
  },
  region: {
    type: String,
    enum: ['global', 'local', 'north_america', 'europe', 'asia', 'other'],
    default: 'global'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moderators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['member', 'moderator', 'admin'],
      default: 'member'
    }
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  rules: [{
    type: String
  }],
  tags: [{
    type: String
  }],
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
communityGroupSchema.index({ category: 1, region: 1 });
communityGroupSchema.index({ 'members.userId': 1 });
communityGroupSchema.index({ isActive: 1, lastActivity: -1 });

// Virtual for member count
communityGroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

export default mongoose.models.CommunityGroup || mongoose.model('CommunityGroup', communityGroupSchema);
