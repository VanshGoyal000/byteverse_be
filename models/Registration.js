const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  eventId: {
    type: String, // Changed from ObjectId for easier frontend compatibility
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  github: {
    type: String,
    trim: true
  },
  linkedin: {
    type: String,
    trim: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  // Add ticket ID field to store the generated ticket identifier
  ticketId: {
    type: String,
    unique: true
  }
});

// Create a compound index to prevent duplicate registrations
RegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
