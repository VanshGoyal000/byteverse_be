const express = require('express');
const router = express.Router();
const { adminLogin, getDashboardStats, getProjectSubmissions, reviewProjectSubmission } = require('../controllers/adminController');
const { adminProtect } = require('../middleware/authMiddleware');

// Public admin routes
router.post('/login', adminLogin);

// Protected admin routes
router.get('/dashboard/stats', adminProtect, getDashboardStats);
router.get('/project-submissions', adminProtect, getProjectSubmissions);
router.put('/project-submissions/:id/review', adminProtect, reviewProjectSubmission);

module.exports = router;
