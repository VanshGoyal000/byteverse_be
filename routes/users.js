const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// Make sure the controller is properly imported and has all required methods
console.log('Loading user routes with controller methods:', 
  Object.keys(userController).join(', '));

// Public routes - get user profile by username
router.get('/profile/:username', userController.getUserProfile);

// Protected routes - require authentication
router.get('/me', protect, userController.getMyProfile);
router.put('/me', protect, userController.updateProfile);

module.exports = router;
