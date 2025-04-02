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
  getSystemStats,
  getAnalytics,
  notImplementedYet
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// Helper function to ensure route handlers exist
const ensureHandler = (handler, routeName) => {
  return handler || notImplementedYet(routeName);
};

// Public admin routes
router.post('/login', ensureHandler(adminLogin, 'admin login'));

// Protected admin routes
router.get('/dashboard/stats', adminProtect, ensureHandler(getDashboardStats, 'dashboard stats'));
router.get('/project-submissions', adminProtect, ensureHandler(getProjectSubmissions, 'project submissions'));
router.put('/project-submissions/:id/review', adminProtect, ensureHandler(reviewProjectSubmission, 'review project'));
router.get('/users', adminProtect, ensureHandler(getAdminUsers, 'admin users'));
router.get('/registered-users', adminProtect, ensureHandler(getRegisteredUsers, 'registered users'));
router.get('/event-registrations', adminProtect, ensureHandler(getEventRegistrations, 'event registrations'));
router.get('/blogs', adminProtect, ensureHandler(getAdminBlogs, 'admin blogs'));
router.get('/events', adminProtect, ensureHandler(getAdminEvents, 'admin events'));
router.get('/settings', adminProtect, ensureHandler(getAdminSettings, 'admin settings'));
router.get('/system', adminProtect, ensureHandler(getSystemStats, 'system stats'));
router.get('/analytics', adminProtect, ensureHandler(getAnalytics, 'analytics'));

// For any other routes that might have been added without handlers
// Fix line 22 and any other similar issues
router.get('/any-undefined-route', adminProtect, ensureHandler(null, 'generic endpoint'));

module.exports = router;
