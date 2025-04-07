const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
  getUser, 
  updateUser, 
  getUserByUsername,
  getUserProfileByUsername,
  getUserBadges,
  getUserActivity
} = require('../controllers/userController');

// User profile routes
router.get('/profile/:username', getUserProfileByUsername);
router.get('/:id', getUser);
router.put('/:id', protect, updateUser);

// User gamification routes
router.get('/:id/badges', getUserBadges);
router.get('/:id/activity', getUserActivity);

module.exports = router;
