const Notification = require('../models/Notification');

// @desc    Get all notifications for the current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    // Get notifications with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name avatar');
      
    // Get count of unread notifications
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user.id,
      isRead: false
    });
    
    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error('Error in getNotifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if notification belongs to current user
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error in markAllAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message
    });
  }
};

// Internal helper function to create notifications
exports.createNotification = async (data) => {
  try {
    await Notification.create(data);
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};
