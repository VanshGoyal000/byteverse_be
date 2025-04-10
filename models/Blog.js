const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  userName: String,
  userImage: String,
  comment: {
    type: String,
    required: [true, 'Please add a comment']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    // Remove unique constraint to prevent duplicate key errors
    index: true // Keep it indexed but not unique
  },
  content: {
    type: String,
    required: [true, 'Please add content']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
  coverImage: {
    type: String
  },
  // Add image status field to track image validation
  imageStatus: {
    type: Object,
    default: {}
  },
  categories: {
    type: [String],
    default: ['Uncategorized']
  },
  tags: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'published'
  },
  featured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: {
    type: String,
    default: 'Anonymous'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  comments: [CommentSchema],
  likedBy: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate slug from title if not provided
BlogSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  // Initialize empty arrays if needed
  if (!this.comments) this.comments = [];
  if (!this.categories) this.categories = [];
  if (!this.tags) this.tags = [];
  if (!this.likedBy) this.likedBy = [];
  
  next();
});

// Add non-conflicting virtuals
BlogSchema.virtual('commentsCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

module.exports = mongoose.model('Blog', BlogSchema);
