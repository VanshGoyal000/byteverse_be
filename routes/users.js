const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// User profile routes
router.get('/profile/:username', userController.getUserProfileByUsername);
router.get('/:id', userController.getUser);
router.put('/:id', protect, userController.updateUser);

// User gamification routes
router.get('/:id/badges', userController.getUserBadges);
router.get('/:id/activity', userController.getUserActivity);

// Public routes
router.get('/profile/:username', userController.getUserProfile);

// Protected routes (require authentication)
router.get('/me', protect, userController.getMyProfile);
router.put('/me', protect, userController.updateProfile);

module.exports = router;
