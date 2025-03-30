const express = require('express');
const router = express.Router();
const { protect, adminAuth } = require('../middleware/authMiddleware');
const { 
  joinCommunity,
  getCommunityMembers
} = require('../controllers/communityController');

// Public route for joining community
router.post('/join', joinCommunity);

// Admin routes
router.get('/members', protect, getCommunityMembers);
router.get('/members', adminAuth, getCommunityMembers); // Fallback

module.exports = router;
