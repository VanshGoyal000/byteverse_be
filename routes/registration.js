const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { protect, adminAuth } = require('../middleware/authMiddleware');

// Public routes
// POST /api/registrations/events/:eventId - Register for event
router.post('/events/:eventId', registrationController.registerForEvent);

// POST /api/registrations/events/:eventId/check - Check registration status
router.post('/events/:eventId/check', registrationController.checkRegistrationStatus);

// POST /api/registrations/events/:eventId/resend - Resend confirmation email
router.post('/events/:eventId/resend', registrationController.resendConfirmation);

// Admin routes
// GET /api/registrations/events/:eventId - Get all registrations for an event
router.get('/events/:eventId', protect, registrationController.getRegistrationsByEvent);
router.get('/events/:eventId', adminAuth, registrationController.getRegistrationsByEvent); // Fallback

// POST /api/registrations/events/:eventId/send-group-link - Send group link to all registrants
router.post('/events/:eventId/send-group-link', protect, registrationController.sendGroupLinksToRegistrants);
router.post('/events/:eventId/send-group-link', adminAuth, registrationController.sendGroupLinksToRegistrants); // Fallback

module.exports = router;
