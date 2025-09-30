import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  tokens: {
    type: Number,
    default: 0
  }
}, { _id: true });

const ChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
    default: 'New Conversation'
  },
  messages: [MessageSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  totalTokens: {
    type: Number,
    default: 0
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    model: {
      type: String,
      default: 'gpt-3.5-turbo'
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 1000
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for message count
ChatSchema.virtual('messageCount').get(function() {
  try {
    return (this.messages && Array.isArray(this.messages)) ? this.messages.length : 0;
  } catch (error) {
    console.error('Error in messageCount virtual:', error);
    return 0;
  }
});

// Virtual for conversation preview (first user message)
ChatSchema.virtual('preview').get(function() {
  if (!this.messages || this.messages.length === 0) {
    return 'New conversation';
  }
  
  const firstUserMessage = this.messages.find(msg => msg.role === 'user');
  if (firstUserMessage) {
    return firstUserMessage.content.length > 50 
      ? firstUserMessage.content.substring(0, 50) + '...'
      : firstUserMessage.content;
  }
  return 'New conversation';
});

// Index for better query performance
ChatSchema.index({ userId: 1, lastMessageAt: -1 });
ChatSchema.index({ userId: 1, isActive: 1, lastMessageAt: -1 });

// Pre-save middleware to update lastMessageAt and generate title
ChatSchema.pre('save', function(next) {
  // Initialize messages array if it doesn't exist
  if (!this.messages) {
    this.messages = [];
  }
  
  if (this.messages.length > 0) {
    // Update lastMessageAt to the timestamp of the last message
    const lastMessage = this.messages[this.messages.length - 1];
    this.lastMessageAt = lastMessage.timestamp || new Date();
    
    // Auto-generate title from first user message if title is still default
    if (this.title === 'New Conversation' && this.messages.length >= 1) {
      const firstUserMessage = this.messages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        // Generate title from first 5-8 words of the first user message
        const words = firstUserMessage.content.split(' ').slice(0, 6);
        this.title = words.join(' ');
        if (firstUserMessage.content.split(' ').length > 6) {
          this.title += '...';
        }
      }
    }
    
    // Calculate total tokens
    this.totalTokens = this.messages.reduce((total, msg) => total + (msg.tokens || 0), 0);
  } else {
    // Set defaults for empty chat
    this.totalTokens = 0;
    if (!this.lastMessageAt) {
      this.lastMessageAt = new Date();
    }
  }
  next();
});

// Instance method to add a message
ChatSchema.methods.addMessage = function(role, content, tokens = 0) {
  try {
    console.log('Adding message:', { role, content: content.substring(0, 50) + '...', tokens });
    
    if (!this.messages) {
      console.log('Initializing messages array');
      this.messages = [];
    }
    
    const newMessage = {
      role,
      content,
      tokens,
      timestamp: new Date()
    };
    
    this.messages.push(newMessage);
    console.log('Message added to array, saving...');
    
    return this.save();
  } catch (error) {
    console.error('Error in addMessage:', error);
    throw error;
  }
};

// Instance method to get recent messages (for context)
ChatSchema.methods.getRecentMessages = function(limit = 10) {
  if (!this.messages) {
    return [];
  }
  return this.messages.slice(-limit);
};

// Static method to get user's chats
ChatSchema.statics.getUserChats = function(userId, limit = 20) {
  return this.find({ 
    userId, 
    isActive: true 
  })
  .sort({ lastMessageAt: -1 })
  .limit(limit)
  .select('title preview messageCount lastMessageAt totalTokens');
};

// Static method to create new chat
ChatSchema.statics.createChat = function(userId, title = 'New Conversation') {
  return this.create({
    userId,
    title,
    messages: [],
    lastMessageAt: new Date()
  });
};

// Prevent duplicate model compilation
const Chat = mongoose.models.Chat || mongoose.model('Chat', ChatSchema);

export default Chat;
