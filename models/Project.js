const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
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
  dateCreated: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Project', ProjectSchema);
