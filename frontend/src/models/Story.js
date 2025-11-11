import mongoose from 'mongoose';

const StorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Story title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Story content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['journey', 'milestone', 'lifestyle', 'technology', 'community'],
    default: 'journey'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  author: {
    type: String,
    required: true
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  likedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    author: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
StorySchema.index({ authorId: 1 });
StorySchema.index({ category: 1 });
StorySchema.index({ tags: 1 });
StorySchema.index({ createdAt: -1 });
StorySchema.index({ likes: -1 });
StorySchema.index({ isFeatured: -1, createdAt: -1 });

// Virtual for comment count
StorySchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Method to add a like
StorySchema.methods.addLike = function(userId) {
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
    this.likes = this.likedBy.length;
  }
  return this.save();
};

// Method to remove a like
StorySchema.methods.removeLike = function(userId) {
  this.likedBy = this.likedBy.filter(id => !id.equals(userId));
  this.likes = this.likedBy.length;
  return this.save();
};

// Method to add a comment
StorySchema.methods.addComment = function(commentData) {
  this.comments.push(commentData);
  return this.save();
};

// Static method to get featured stories
StorySchema.statics.getFeatured = function(limit = 5) {
  return this.find({ 
    isFeatured: true, 
    isPublished: true,
    moderationStatus: 'approved'
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Static method to get stories by category
StorySchema.statics.getByCategory = function(category, limit = 10) {
  return this.find({ 
    category,
    isPublished: true,
    moderationStatus: 'approved'
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Ensure virtual fields are serialized
StorySchema.set('toJSON', { virtuals: true });
StorySchema.set('toObject', { virtuals: true });

export default mongoose.models.Story || mongoose.model('Story', StorySchema);
