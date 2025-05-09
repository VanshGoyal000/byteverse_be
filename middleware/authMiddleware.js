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

// Admin protect middleware
exports.adminProtect = async (req, res, next) => {
  try {
    // First apply the regular protect middleware
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Admin authorization required'
      });
    }
    
    // Try to verify with admin token first
    try {
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'adminbyteversesecret12345');
      req.admin = await Admin.findById(decoded.id);
      
      if (!req.admin) {
        throw new Error('Admin not found');
      }
      
      next();
    } catch (adminError) {
      // If admin verification fails, try as regular user with admin role
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'byteversesecret12345');
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
          throw new Error('User not found');
        }
        
        if (req.user.role !== 'admin') {
          throw new Error('User is not an admin');
        }
        
        next();
      } catch (userError) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized as an admin'
        });
      }
    }
  } catch (error) {
    console.error('Admin protect error:', error);
    return res.status(401).json({
      success: false,
      message: 'Admin authorization failed'
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
