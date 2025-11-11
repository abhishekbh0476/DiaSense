import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
  },
  ingredients: [{
    name: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    unit: {
      type: String
    }
  }],
  instructions: [{
    step: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    }
  }],
  nutrition: {
    calories: Number,
    carbs: Number,
    protein: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number
  },
  servings: {
    type: Number,
    required: true,
    min: 1
  },
  prepTime: {
    type: Number, // in minutes
    required: true
  },
  cookTime: {
    type: Number, // in minutes
    default: 0
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  tags: [{
    type: String,
    enum: ['low-carb', 'keto', 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'quick', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert']
  }],
  diabetesFriendly: {
    type: Boolean,
    default: true
  },
  glycemicIndex: {
    type: String,
    enum: ['low', 'medium', 'high']
  },
  ratings: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  saves: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  image: {
    type: String // URL to image
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
recipeSchema.index({ authorId: 1, createdAt: -1 });
recipeSchema.index({ tags: 1, diabetesFriendly: 1 });
recipeSchema.index({ isApproved: 1, createdAt: -1 });

// Virtual for average rating
recipeSchema.virtual('averageRating').get(function() {
  if (this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return (sum / this.ratings.length).toFixed(1);
});

// Virtual for like count
recipeSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for save count
recipeSchema.virtual('saveCount').get(function() {
  return this.saves.length;
});

export default mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);
