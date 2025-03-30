const mongoose = require('mongoose');

const PendingProjectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    trim: true
  },
  longDescription: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: '/projects/default.jpg'
  },
  tags: {
    type: [String]
  },
  github: {
    type: String
  },
  demo: {
    type: String
  },
  contributors: {
    type: [String]
  },
  technologies: {
    type: [String]
  },
  submitterName: {
    type: String,
    required: [true, 'Submitter name is required']
  },
  submitterEmail: {
    type: String,
    required: [true, 'Submitter email is required'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminFeedback: {
    type: String
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PendingProject', PendingProjectSchema);
