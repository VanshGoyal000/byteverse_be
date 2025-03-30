const express = require('express');
const router = express.Router();
const { protect, adminAuth } = require('../middleware/authMiddleware');
const {
  submitProject,
  getPendingProjects,
  approveProject,
  rejectProject,
  getProjectStatistics
} = require('../controllers/projectSubmissionController');

// Public route for project submission
router.post('/submit', submitProject);

// Admin routes (protected) - using JWT authentication
router.get('/pending', protect, getPendingProjects);
router.put('/approve/:id', protect, approveProject);
router.put('/reject/:id', protect, rejectProject);
router.get('/stats', protect, getProjectStatistics);

// Fallback routes using admin key authentication
router.get('/pending', adminAuth, getPendingProjects);
router.put('/approve/:id', adminAuth, approveProject);
router.put('/reject/:id', adminAuth, rejectProject);
router.get('/stats', adminAuth, getProjectStatistics);

module.exports = router;
