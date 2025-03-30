const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect routes - JWT authentication
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mysecretkey');

    // Add admin to req object
    req.admin = await Admin.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

// Simple admin key authentication (fallback)
exports.adminAuth = (req, res, next) => {
  const adminKey = req.headers['admin-key'];
  
  // In a real application, you'd use the JWT method above
  // This is just a simple fallback
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access'
    });
  }
  
  next();
};
