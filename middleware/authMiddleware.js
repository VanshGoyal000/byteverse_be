const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Protect routes - User authentication
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'byteversesecret12345');

    // Add user to request object
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'undefined'} is not authorized to perform this action`
      });
    }
    next();
  };
};

// Admin authentication middleware
exports.adminAuth = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Extract token from Bearer token
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'adminbyteversesecret12345');

    // Add admin to request object
    req.admin = await Admin.findById(decoded.id);

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found'
      });
    }

    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource'
    });
  }
};

// Optional auth - doesn't require authentication but attaches user if authenticated
exports.optionalAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      // No token, continue without user
      return next();
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists with that id
    const user = await User.findById(decoded.id);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Token invalid but proceed anyway (just without authenticated user)
    next();
  }
};

// @desc    Protect routes for admin users only
exports.adminProtect = async (req, res, next) => {
  try {
    // First apply the regular protect middleware
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers['admin-token']) {
      token = req.headers['admin-token'];
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from DB
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has admin role
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }
    
    // Set user in request
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in adminProtect middleware:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this resource',
      error: error.message
    });
  }
};
