const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'mention', 'follow', 'event', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    enum: ['blog', 'comment', 'project', 'event', 'user', 'system'],
    required: true
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  link: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Auto-delete after 30 days
  }
});

// Index for efficient queries
NotificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
