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

// @desc    Get admin settings
// @route   GET /api/admin/settings
// @access  Private (Admin only)
exports.getAdminSettings = async (req, res) => {
  try {
    // Get site configuration settings from database or defaults
    const settings = {
      siteName: 'ByteVerse',
      maintenanceMode: false,
      allowRegistration: true,
      requireEmailVerification: true,
      maxUploadSize: 5, // MB
      featuredEvents: [],
      featuredBlogs: [],
      customTheme: {
        primaryColor: '#6e9ef5',
        secondaryColor: '#8A2BE2',
      },
      // Add any other site-wide settings
    };
    
    // You could eventually fetch these from a Settings model in your database
    
    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error in getAdminSettings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin settings',
      error: error.message
    });
  }
};

// @desc    Get system statistics or any other missing admin route
// @route   GET /api/admin/system
// @access  Private (Admin only)
exports.getSystemStats = async (req, res) => {
  try {
    // This is a generic handler for any missing route
    // You can customize this based on what route is actually missing at line 20
    
    const stats = {
      systemHealth: 'good',
      serverUptime: process.uptime(),
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development',
      lastRestart: new Date(Date.now() - process.uptime() * 1000).toISOString()
    };
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getSystemStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching system statistics',
      error: error.message
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

// @desc    Review project submission
// @route   PUT /api/admin/project-submissions/:id/review
// @access  Private (Admin only)
exports.reviewProjectSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, feedback } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const projectSubmission = await ProjectSubmission.findById(id);
    
    if (!projectSubmission) {
      return res.status(404).json({
        success: false,
        message: 'Project submission not found'
      });
    }
    
    projectSubmission.status = status;
    projectSubmission.feedback = feedback;
    projectSubmission.reviewedAt = Date.now();
    projectSubmission.reviewedBy = req.user.id;
    
    await projectSubmission.save();
    
    // If project is approved, also add it to the public projects collection
    if (status === 'approved') {
      // Create a public project from the submission
      await Project.create({
        title: projectSubmission.title,
        description: projectSubmission.description,
        technologies: projectSubmission.technologies,
        liveUrl: projectSubmission.liveUrl,
        repoUrl: projectSubmission.repoUrl,
        image: projectSubmission.image,
        submittedBy: projectSubmission.user
      });
    }
    
    res.status(200).json({
      success: true,
      data: projectSubmission
    });
  } catch (error) {
    console.error('Error in reviewProjectSubmission:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing project submission',
      error: error.message
    });
  }
};

// @desc    Get admin users list
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getAdminUsers = async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    
    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins
    });
  } catch (error) {
    console.error('Error in getAdminUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin users',
      error: error.message
    });
  }
};

// @desc    Get registered users list
// @route   GET /api/admin/registered-users
// @access  Private (Admin only)
exports.getRegisteredUsers = async (req, res) => {
  try {
    // Add pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      count: users.length,
      total,
      data: users
    });
  } catch (error) {
    console.error('Error in getRegisteredUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching registered users',
      error: error.message
    });
  }
};

// @desc    Get event registrations
// @route   GET /api/admin/event-registrations
// @access  Private (Admin only)
exports.getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.query;
    
    // Build query based on whether eventId is provided
    const query = eventId ? { event: eventId } : {};
    
    const registrations = await Registration.find(query)
      .populate('event', 'title date')
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    console.error('Error in getEventRegistrations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching event registrations',
      error: error.message
    });
  }
};

// @desc    Get admin blogs list
// @route   GET /api/admin/blogs
// @access  Private (Admin only)
exports.getAdminBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .populate('author', 'name email');
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error in getAdminBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// @desc    Get admin events list
// @route   GET /api/admin/events
// @access  Private (Admin only)
exports.getAdminEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error in getAdminEvents:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
      error: error.message
    });
  }
};
