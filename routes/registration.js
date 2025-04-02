const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  register,
  checkRegistration,
  getUserRegistrations,
  getEventRegistrations,
  updateRegistrationGroupLink
} = require('../controllers/registrationController');

// Check if a user is registered for an event
router.post('/events/:eventId/check', checkRegistration);

// Register for an event (with optional auth)
router.post('/events/:eventId', optionalAuth, register);

// Get user's event registrations
router.get('/user', protect, getUserRegistrations);

// Get all registrations for an event (admin only)
router.get('/events/:eventId', protect, getEventRegistrations);

// Update group link for registrants
router.put('/events/:eventId/group-link', protect, updateRegistrationGroupLink);

module.exports = router;
