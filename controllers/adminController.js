const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// Use environment variables for URLs
const clientBaseUrl = process.env.BASE_URL || 'https://byteverse.tech';

// @desc    Login admin
// @route   POST /api/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username and password'
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'mysecretkey',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Login admin user
// @route   POST /api/admin/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    // Check for admin
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check if password matches
    const isMatch = await admin.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Create token
    const token = admin.getSignedJwtToken();
    
    // Send response
    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email
      }
    });
  } catch (error) {
    console.error('Error in adminLogin:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/me
// @access  Private
exports.getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id);

    res.status(200).json({
      success: true,
      data: admin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Send group link to all event registrants
// @route   POST /api/admin/events/:id/send-group-link
// @access  Private/Admin
exports.sendGroupLink = async (req, res) => {
  try {
    // ...existing code...
    
    // Use configured URL instead of hardcoded localhost
    const eventUrl = `${clientBaseUrl}/events/${event._id}`;
    
    // ...rest of the function...
  } catch (error) {
    // ...error handling...
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    // Get counts of different entities
    const userCount = await User.countDocuments();
    const blogCount = await Blog.countDocuments();
    const eventCount = await Event.countDocuments();
    const projectCount = await Project.countDocuments();
    
    // Get pending project submissions
    const pendingSubmissions = await ProjectSubmission.countDocuments({ status: 'pending' });
    
    // Get recent registrations
    const recentRegistrations = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('event', 'title');
    
    res.status(200).json({
      success: true,
      data: {
        counts: {
          users: userCount,
          blogs: blogCount,
          events: eventCount,
          projects: projectCount,
          pendingSubmissions
        },
        recentRegistrations
      }
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

// @desc    Get project submissions
// @route   GET /api/admin/project-submissions
// @access  Private (Admin only)
exports.getProjectSubmissions = async (req, res) => {
  try {
    const status = req.query.status || 'all';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (status !== 'all') {
      query.status = status;
    }
    
    const submissions = await ProjectSubmission.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');
    
    const total = await ProjectSubmission.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: submissions.length,
      total,
      data: submissions
    });
  } catch (error) {
    console.error('Error in getProjectSubmissions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project submissions',
      error: error.message
    });
  }
};
