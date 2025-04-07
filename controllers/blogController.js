const Blog = require('../models/Blog');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { optimizeBlogContent } = require('../utils/contentOptimizer');

// @desc    Get all blogs (with filters and pagination)
// @route   GET /api/blogs
// @access  Public
exports.getBlogs = async (req, res) => {
  try {
    // Build query
    let query = {};
    
    // Public API only returns published posts
    query.published = true;
    
    // Filter by category, tag, author
    if (req.query.category) {
      query.categories = req.query.category;
    }
    
    if (req.query.tag) {
      query.tags = req.query.tag;
    }
    
    if (req.query.author) {
      // Find author by slug or ID
      let author;
      if (mongoose.Types.ObjectId.isValid(req.query.author)) {
        author = await User.findById(req.query.author);
      }
      
      if (author) {
        query.author = author._id;
      }
    }
    
    // Search in title or content
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { content: searchRegex }
      ];
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Blog.countDocuments(query);
    
    // Execute query
    const blogs = await Blog.find(query)
      .populate('author', 'name avatar bio')
      .sort({ publishedAt: -1 })
      .skip(startIndex)
      .limit(limit);
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      total,
      pagination,
      data: blogs
    });
  } catch (error) {
    console.error('Error in getBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// @desc    Get single blog
// @route   GET /api/blogs/:id
// @access  Public
exports.getBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name avatar bio');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if the blog is published or if the user is the author/admin
    if (!blog.published) {
      // If user is not authenticated, return 404
      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }
      
      // If user is not the author or an admin, return 404
      if (req.user._id.toString() !== blog.author._id.toString() && req.user.role !== 'admin') {
        return res.status(404).json({
          success: false,
          message: 'Blog not found'
        });
      }
    }
    
    // Increment view count only if blog is published
    // Add rate limiting to prevent view count manipulation
    const userIP = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const viewKey = `${blog._id.toString()}_${userIP}`;
    const viewsCache = req.app.locals.viewsCache || {}; // Use app local storage for simple cache
    
    const now = Date.now();
    const lastViewed = viewsCache[viewKey] || 0;
    
    // Only count as a new view if it has been more than 30 minutes since last view from this IP
    if (now - lastViewed > 30 * 60 * 1000) {
      blog.views = (blog.views || 0) + 1;
      await blog.save();
      viewsCache[viewKey] = now;
      req.app.locals.viewsCache = viewsCache;
    }
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error in getBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private
exports.createBlog = async (req, res) => {
  try {
    // Check if user is verified
    if (!req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Your account must be verified before you can create blog posts'
      });
    }
    
    // Optimize the blog content before saving
    const optimizedBlogData = optimizeBlogContent(req.body);
    
    // Log the size reduction
    const originalSize = JSON.stringify(req.body).length;
    const optimizedSize = JSON.stringify(optimizedBlogData).length;
    console.log(`Blog content optimized: ${originalSize} bytes → ${optimizedSize} bytes (${Math.round((originalSize - optimizedSize) / originalSize * 100)}% reduction)`);
    
    // Get user information for author details
    const author = req.user || {};
    
    // Create the blog with optimized content and author information
    const blog = await Blog.create({
      ...optimizedBlogData,
      author: author._id || optimizedBlogData.author || null,
      authorName: optimizedBlogData.authorName || author.name || 'Anonymous' // Ensure authorName is always provided
    });
    
    res.status(201).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.warn('Error in createBlog:', error);
    
    // Send a more specific error message for validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid blog data',
        error: error.message,
        validationErrors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Make sure user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this blog'
      });
    }
    
    // If published status is being changed to true, set publishedAt
    if (!blog.published && req.body.published === true) {
      req.body.publishedAt = Date.now();
    }
    
    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error in updateBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Make sure user is blog owner or admin
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this blog'
      });
    }
    
    await Blog.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// @desc    Get blogs by user
// @route   GET /api/blogs/user
// @access  Private
exports.getUserBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    console.error('Error in getUserBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user blogs',
      error: error.message
    });
  }
};

// @desc    Like/unlike blog
// @route   PUT /api/blogs/:id/like
// @access  Private
exports.likeBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Check if user has already liked the blog
    const userId = req.user._id.toString();
    const likedByArray = blog.likedBy || [];
    const alreadyLiked = likedByArray.some(id => id.toString() === userId);
    
    // Toggle like status
    if (alreadyLiked) {
      // Remove like
      blog.likedBy = likedByArray.filter(id => id.toString() !== userId);
      blog.likes = Math.max(0, (blog.likes || 1) - 1); // Ensure likes don't go below 0
    } else {
      // Add like
      blog.likedBy = [...likedByArray, userId];
      blog.likes = (blog.likes || 0) + 1;
    }
    
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: {
        likes: blog.likes,
        liked: !alreadyLiked
      }
    });
  } catch (error) {
    console.error('Error in likeBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Save/unsave blog post to user's reading list
exports.saveBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Check if blog exists
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    const user = await User.findById(userId);
    
    // Check if blog is already saved
    const isSaved = user.savedBlogs && user.savedBlogs.includes(id);
    
    if (isSaved) {
      // Remove blog from saved list
      user.savedBlogs = user.savedBlogs.filter(blogId => blogId.toString() !== id);
    } else {
      // Add blog to saved list
      if (!user.savedBlogs) {
        user.savedBlogs = [];
      }
      user.savedBlogs.push(id);
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      isSaved: !isSaved
    });
  } catch (error) {
    console.error('Error in saveBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving blog',
      error: error.message
    });
  }
};

// Get all saved blogs for the current user
exports.getSavedBlogs = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user with populated saved blogs
    const user = await User.findById(userId).populate({
      path: 'savedBlogs',
      select: 'title excerpt coverImage createdAt author',
      populate: {
        path: 'author',
        select: 'name avatar'
      }
    });
    
    if (!user.savedBlogs) {
      user.savedBlogs = [];
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      count: user.savedBlogs.length,
      data: user.savedBlogs
    });
  } catch (error) {
    console.error('Error in getSavedBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved blogs',
      error: error.message
    });
  }
};

// Get draft blogs for the current user
exports.getDraftBlogs = async (req, res) => {
  try {
    const drafts = await Blog.find({ 
      author: req.user._id,
      published: false
    }).sort({ updatedAt: -1 });
    
    res.status(200).json({
      success: true,
      count: drafts.length,
      data: drafts
    });
  } catch (error) {
    console.error('Error in getDraftBlogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching draft blogs',
      error: error.message
    });
  }
};

// Update a draft blog
exports.updateDraftBlog = async (req, res) => {
  try {
    const draft = await Blog.findOne({
      _id: req.params.id,
      author: req.user._id,
      published: false
    });
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found or you do not have permission to edit it'
      });
    }
    
    // Update the draft with request body data
    Object.keys(req.body).forEach(key => {
      draft[key] = req.body[key];
    });
    
    // Ensure it stays as a draft
    draft.published = false;
    
    await draft.save();
    
    res.status(200).json({
      success: true,
      message: 'Draft updated successfully',
      data: draft
    });
  } catch (error) {
    console.error('Error in updateDraftBlog:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating draft blog',
      error: error.message
    });
  }
};

// Publish a draft blog
exports.publishDraft = async (req, res) => {
  try {
    const draft = await Blog.findOne({
      _id: req.params.id,
      author: req.user._id,
      published: false
    });
    
    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found or you do not have permission to publish it'
      });
    }
    
    // Set published to true and publishedAt to current date
    draft.published = true;
    draft.publishedAt = new Date();
    
    await draft.save();
    
    res.status(200).json({
      success: true,
      message: 'Draft published successfully',
      data: draft
    });
  } catch (error) {
    console.error('Error in publishDraft:', error);
    res.status(500).json({
      success: false,
      message: 'Error publishing draft blog',
      error: error.message
    });
  }
};

// @desc    Comment on a blog
// @route   POST /api/blogs/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { comment } = req.body;
    
    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }
    
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    const newComment = {
      user: req.user.id,
      userName: req.user.name,
      userImage: req.user.avatar,
      comment
    };
    
    blog.comments.push(newComment);
    await blog.save();
    
    // Create notification for blog author if commenter is not the author
    if (blog.author.toString() !== req.user.id) {
      await createNotification({
        recipient: blog.author,
        type: 'comment',
        content: `${req.user.name} commented on your blog post "${blog.title}"`,
        resourceType: 'blog',
        resourceId: blog._id,
        sender: req.user.id,
        link: `/blogs/${blog._id}#comments`
      });
    }
    
    res.status(201).json({
      success: true,
      data: blog.comments
    });
  } catch (error) {
    console.error('Error in addComment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/blogs/:id/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Find the comment
    const comment = blog.comments.id(req.params.commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is authorized to delete (comment author or blog author or admin)
    if (
      comment.user.toString() !== req.user.id &&
      blog.author.toString() !== req.user.id && 
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    // Don't use comment.remove() as it's not a function in newer Mongoose
    // Instead, use the pull method on the comments array
    blog.comments.pull(req.params.commentId);
    await blog.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteComment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};
