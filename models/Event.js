const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
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
  details: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: '/events/default.jpg'
  },
  date: {
    type: String,
    required: [true, 'Please add an event date']
  },
  time: {
    type: String
  },
  location: {
    type: String
  },
  organizer: {
    type: String
  },
  registrationUrl: {
    type: String
  },
  isUpcoming: {
    type: Boolean,
    default: true
  },
  agenda: [
    {
      time: String,
      title: String,
      description: String
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', EventSchema);
