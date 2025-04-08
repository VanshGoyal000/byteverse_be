const mongoose = require('mongoose');
const User = require('../models/User');

// Get user profile by username
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username or name (case insensitive)
    const user = await User.findOne({
      $or: [
        { username: new RegExp(`^${username}$`, 'i') },
        { name: new RegExp(`^${username}$`, 'i') }
      ]
    }).select('-password -passwordResetToken -passwordResetExpire');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's blogs if Blog model exists
    let blogs = [];
    try {
      if (mongoose.modelNames().includes('Blog')) {
        const Blog = mongoose.model('Blog');
        blogs = await Blog.find({ author: user._id })
          .select('title excerpt coverImage createdAt likeCount viewCount')
          .sort({ createdAt: -1 })
          .limit(5);
      }
    } catch (error) {
      console.warn('Error fetching blogs:', error.message);
    }
    
    // Get user's projects if Project model exists
    let projects = [];
    try {
      if (mongoose.modelNames().includes('Project')) {
        const Project = mongoose.model('Project');
        projects = await Project.find({ author: user._id })
          .select('title description thumbnail createdAt')
          .sort({ createdAt: -1 })
          .limit(5);
      }
    } catch (error) {
      console.warn('Error fetching projects:', error.message);
    }
    
    // Prepare response data
    const profileData = {
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.isEmailPublic ? user.email : undefined,
      bio: user.bio || '',
      avatar: user.avatar || '',
      website: user.website || '',
      socialLinks: user.socialLinks || {},
      joinedAt: user.createdAt,
      role: user.role,
      blogs,
      projects
    };
    
    res.status(200).json({
      success: true,
      data: profileData
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Get current user's profile (authenticated)
exports.getMyProfile = async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await User.findById(req.user.id).select('-password -passwordResetToken -passwordResetExpire');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update current user's profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      website,
      socialLinks,
      isEmailPublic,
      avatar
    } = req.body;
    
    // Fields to update
    const updateFields = {};
    
    // Only update fields that were provided
    if (name) updateFields.name = name;
    if (bio !== undefined) updateFields.bio = bio;
    if (website !== undefined) updateFields.website = website;
    if (socialLinks) updateFields.socialLinks = socialLinks;
    if (isEmailPublic !== undefined) updateFields.isEmailPublic = isEmailPublic;
    if (avatar) updateFields.avatar = avatar;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password -passwordResetToken -passwordResetExpire');
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};
