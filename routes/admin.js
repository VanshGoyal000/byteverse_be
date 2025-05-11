const express = require('express');
const router = express.Router();
const { 
  login, 
  getMe
} = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// Admin auth routes
router.post('/login', login);
router.get('/me', adminProtect, getMe);

// Import only the available controllers
// Use an empty object if the import fails completely
let adminControllers = {};
try {
  adminControllers = require('../controllers/adminController');
} catch (error) {
  console.error('Error loading admin controllers:', error);
}

// Helper function to ensure route handlers exist
const ensureHandler = (controllerName) => {
  const handler = adminControllers[controllerName];
  
  if (typeof handler === 'function') {
    return handler;
  }
  
  console.warn(`Warning: Handler '${controllerName}' is not a function. Using placeholder.`);
  return (req, res) => {
    res.status(501).json({ 
      success: false, 
      message: `The endpoint '${controllerName}' is not implemented yet.`,
      endpoint: req.originalUrl
    });
  };
};

// Public admin routes
router.post('/login', ensureHandler('adminLogin'));

// Protected admin routes
router.get('/dashboard/stats', adminProtect, ensureHandler('getDashboardStats'));
router.get('/project-submissions', adminProtect, ensureHandler('getProjectSubmissions'));
router.put('/project-submissions/:id/review', adminProtect, ensureHandler('reviewProjectSubmission'));
router.get('/users', adminProtect, ensureHandler('getAdminUsers'));
router.get('/registered-users', adminProtect, ensureHandler('getRegisteredUsers'));
router.get('/event-registrations', adminProtect, ensureHandler('getEventRegistrations'));
router.get('/blogs', adminProtect, ensureHandler('getAdminBlogs'));
router.get('/events', adminProtect, ensureHandler('getAdminEvents'));
router.get('/settings', adminProtect, ensureHandler('getAdminSettings'));
router.get('/system', adminProtect, ensureHandler('getSystemStats'));
router.get('/analytics', adminProtect, ensureHandler('getAnalytics'));

module.exports = router;