const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');

// Get all comments for a blog
exports.getComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    
    // Check if blogId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }
    
    const comments = await Comment.find({ blog: blogId })
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar')
      .populate({
        path: 'parentComment',
        select: 'content author createdAt'
      });
    
    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Add a comment to a blog
exports.addComment = async (req, res) => {
  try {
    const { blogId } = req.params;
    const { content, parentComment } = req.body;
    
    // Check if blogId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog ID'
      });
    }
    
    // Verify that the blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Create comment data
    const commentData = {
      content,
      blog: blogId,
      author: req.body.author || (req.user ? req.user.name : 'Anonymous'),
      parentComment: parentComment || null
    };
    
    // Add user reference if authenticated
    if (req.user) {
      commentData.user = req.user._id;
    }
    
    // Create the comment
    const comment = await Comment.create(commentData);
    
    // Return the new comment
    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Check if commentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if the user has permission to delete this comment
    if (req.user && (req.user.role === 'admin' || (comment.user && comment.user.toString() === req.user._id.toString()))) {
      await Comment.findByIdAndDelete(commentId);
      
      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this comment'
      });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Like a comment
exports.likeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    // Check if commentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID'
      });
    }
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Increment likes
    comment.likes += 1;
    await comment.save();
    
    res.status(200).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Error liking comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error.message
    });
  }
};
