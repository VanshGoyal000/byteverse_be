const mongoose = require('mongoose');
const slugify = require('slugify');

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
  }
});

// Add virtual for comments
BlogSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'blog',
  justOne: false
});

// Enable virtuals when converted to JSON
BlogSchema.set('toJSON', { virtuals: true });
BlogSchema.set('toObject', { virtuals: true });

// Create slug from title before saving, but don't enforce uniqueness
// Instead, append a timestamp if duplicate detection is needed
BlogSchema.pre('save', function(next) {
  // Update the updatedAt timestamp if it's not a new document
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  
  // Create slug from title if not already set
  if (!this.slug) {
    this.slug = slugify(this.title, {
      lower: true,
      strict: true
    });
    
    // Add timestamp to slug to ensure uniqueness
    this.slug = `${this.slug}-${Date.now()}`;
  }
  
  next();
});

module.exports = mongoose.model('Blog', BlogSchema);
