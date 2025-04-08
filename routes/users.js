const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getUser, 
  updateUser, 
  getUserByUsername,
  getUserProfileByUsername,
  getUserBadges,
  getUserActivity,
  getUserProfile, 
  getMyProfile, 
  updateProfile 
} = require('../controllers/userController');

// User profile routes
router.get('/profile/:username', getUserProfileByUsername);
router.get('/:id', getUser);
router.put('/:id', protect, updateUser);

// User gamification routes
router.get('/:id/badges', getUserBadges);
router.get('/:id/activity', getUserActivity);

// Public routes
router.get('/profile/:username', getUserProfile);

// Protected routes (require authentication)
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateProfile);

module.exports = router;
