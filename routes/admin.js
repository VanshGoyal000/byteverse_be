const express = require('express');
const router = express.Router();
const { loginAdmin, getAdmin } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', loginAdmin);

// Protected routes
router.get('/me', protect, getAdmin);

module.exports = router;
