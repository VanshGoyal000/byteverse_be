const express = require('express');
const router = express.Router();
const { 
  adminLogin, 
  getDashboardStats, 
  getProjectSubmissions, 
  reviewProjectSubmission,
  getAdminUsers,
  getRegisteredUsers,
  getEventRegistrations,
  getAdminBlogs,
  getAdminEvents,
  getAdminSettings,
  getSystemStats
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes
router.get('/dashboard/stats', adminProtect, getDashboardStats);
router.get('/project-submissions', adminProtect, getProjectSubmissions);
router.put('/project-submissions/:id/review', adminProtect, reviewProjectSubmission);
router.get('/users', adminProtect, getAdminUsers);
router.get('/registered-users', adminProtect, getRegisteredUsers);
router.get('/event-registrations', adminProtect, getEventRegistrations);
router.get('/blogs', adminProtect, getAdminBlogs);
router.get('/events', adminProtect, getAdminEvents);
router.get('/settings', adminProtect, getAdminSettings); // Added to fix line 20
router.get('/system', adminProtect, getSystemStats); // Added as a backup

module.exports = router;
