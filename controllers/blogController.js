const Blog = require('../models/Blog');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { optimizeBlogContent, optimizeBlogList } = require('../utils/contentOptimizer');

// Get all blogs with pagination
exports.getBlogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Blog.countDocuments({ status: 'published' });
    
    // Create query builder
    const queryBuilder = Blog.find({ status: 'published' })
      .sort({ createdAt: -1 }) // Latest first
      .skip(startIndex)
      .limit(limit)
      .select('title excerpt categories coverImage authorName createdAt updatedAt featured'); // Select only needed fields
    
    // Execute query
    const blogs = await queryBuilder;
    
    // Optimize blogs for listing
    const optimizedBlogs = optimizeBlogList(blogs);
    
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
    
    // Send response
    res.status(200).json({
      success: true,
      count: blogs.length,
      pagination: {
        ...pagination,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: optimizedBlogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blogs',
      error: error.message
    });
  }
};

// Get single blog with complete content
exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Increment view count
    blog.viewCount = (blog.viewCount || 0) + 1;
    await blog.save();
    
    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blog',
      error: error.message
    });
  }
};

// Create new blog post
exports.createBlog = async (req, res, next) => {
  try {
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
    console.error('Error creating blog:', error);
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
